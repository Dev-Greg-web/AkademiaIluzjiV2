import json

def generate_matching_routines(cursor, effect_type: str = "all", difficulty: str = "all") -> dict:
    """
    Deterministically evaluates all database routines against the user's mastered/practiced arsenal.
    Categorizes routines into:
    - Ready to Perform (100% required techniques practiced/mastered)
    - 1 Move Away (Nearly ready: exactly 1 technique missing)
    - In Development (2+ techniques missing)
    """
    cursor.execute("SELECT name, mastery_percentage, status FROM techniques")
    tech_map = {r["name"]: dict(r) for r in cursor.fetchall()}

    query = "SELECT * FROM routines WHERE 1=1"
    params = []

    if effect_type != "all":
        query += " AND effect_type = ?"
        params.append(effect_type)

    if difficulty != "all":
        query += " AND difficulty = ?"
        params.append(difficulty)

    cursor.execute(query, params)
    raw_routines = cursor.fetchall()

    ready_routines = []
    one_move_away = []
    locked_routines = []

    for r in raw_routines:
        r_dict = dict(r)
        try:
            req_techs = json.loads(r_dict.get("techniques_json") or "[]")
        except Exception:
            req_techs = []

        missing_techs = []
        known_techs = []

        for t_name in req_techs:
            t_obj = tech_map.get(t_name)
            if t_obj and (t_obj["status"] in ["Mastered", "Mastered+", "Practicing"] or t_obj["mastery_percentage"] >= 40):
                known_techs.append({
                    "name": t_name,
                    "mastery": t_obj["mastery_percentage"],
                    "status": t_obj["status"]
                })
            else:
                missing_techs.append({
                    "name": t_name,
                    "mastery": t_obj["mastery_percentage"] if t_obj else 0,
                    "status": t_obj["status"] if t_obj else "Locked"
                })

        total_req = len(req_techs) if req_techs else 1
        readiness_pct = round((len(known_techs) / total_req) * 100)

        routine_summary = {
            **r_dict,
            "techniques": req_techs,
            "known_techniques": known_techs,
            "missing_techniques": missing_techs,
            "readiness_percent": readiness_pct
        }

        if len(missing_techs) == 0:
            routine_summary["status_label"] = "Gotowa do pokazu (100%)"
            ready_routines.append(routine_summary)
        elif len(missing_techs) == 1:
            routine_summary["status_label"] = f"Brakuje tylko 1 chwytu: {missing_techs[0]['name']}"
            one_move_away.append(routine_summary)
        else:
            routine_summary["status_label"] = f"Brakuje {len(missing_techs)} chwytów"
            locked_routines.append(routine_summary)

    return {
        "ready": ready_routines,
        "one_move_away": one_move_away,
        "locked": locked_routines,
        "total_count": len(raw_routines)
    }
