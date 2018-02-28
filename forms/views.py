import datetime
import json

from django.forms import model_to_dict
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Form, FormResponse, FormInstance


def index(request):
    return HttpResponse("Hello, this is the index!")


def form(request, investigation_id, form_instance_id):
    form_instance = FormInstance.objects.get(id=form_instance_id)
    return JsonResponse(model_to_dict(form_instance))


@csrf_exempt
def form_response(request, investigation_id, form_instance_id):
    if request.method == "POST":
        data = json.loads(request.body.decode('utf-8'))
        response = FormResponse()
        response.json = data
        response.form_instance_id = form_instance_id
        response.submission_date = datetime.datetime.now()
        response.save()
        return JsonResponse({"status": "ok", "token": response.token})


def form_data(request, token):
    response = FormResponse.objects.filter(token=token).first()
    return JsonResponse(model_to_dict(response))