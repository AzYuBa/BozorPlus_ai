from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response
    data = response.data
    message = "Xato"
    field_errors = {}
    if isinstance(data, dict):
        if "detail" in data:
            message = str(data["detail"])
        else:
            for key, val in data.items():
                if isinstance(val, (list, tuple)):
                    field_errors[key] = [str(v) for v in val]
                else:
                    field_errors[key] = [str(val)]
            if field_errors:
                first = next(iter(field_errors.values()))
                message = first[0] if first else message
    elif isinstance(data, list) and data:
        message = str(data[0])
    response.data = {
        "error": {
            "code": response.status_code,
            "message": message,
            "fieldErrors": field_errors,
        }
    }
    return response
