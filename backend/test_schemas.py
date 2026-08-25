import json
with open("openapi.json", "r", encoding="utf16") as f:
    data = json.load(f)

register_schema_ref = data["paths"]["/auth/register"]["post"]["requestBody"]["content"]["application/json"]["schema"]["$ref"]
verify_schema_ref = data["paths"]["/auth/verify-registration-code"]["post"]["requestBody"]["content"]["application/json"]["schema"]["$ref"]

def get_schema(ref):
    parts = ref.split("/")
    curr = data
    for p in parts[1:]:
        curr = curr[p]
    return curr

print("Register Schema:")
print(json.dumps(get_schema(register_schema_ref), indent=2))
print("\nVerify Schema:")
print(json.dumps(get_schema(verify_schema_ref), indent=2))
