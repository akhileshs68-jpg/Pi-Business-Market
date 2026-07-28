import json
with open("tsconfig.json", "r") as f:
    config = json.load(f)

if "exclude" not in config:
    config["exclude"] = []
if "dist" not in config["exclude"]:
    config["exclude"].append("dist")
if "node_modules" not in config["exclude"]:
    config["exclude"].append("node_modules")

with open("tsconfig.json", "w") as f:
    json.dump(config, f, indent=2)
