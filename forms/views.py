import datetime
import json

from django.contrib.auth.mixins import LoginRequiredMixin
from django.forms import model_to_dict
from django.http import HttpResponse, JsonResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import CreateView
from guardian.mixins import PermissionRequiredMixin
from rest_framework import status
from rest_framework.response import Response
from rest_framework.serializers import HyperlinkedModelSerializer, Serializer, ModelSerializer
from rest_framework.views import APIView

from .models import Form, FormResponse, FormInstance


class FormSerializer(ModelSerializer):
    class Meta:
        model = FormInstance
        fields = "__all__"


class FormInstanceDetail(APIView):
    def get_object(self, pk):
        try:
            return FormInstance.objects.get(id=pk)
        except FormInstance.DoesNotExist:
            raise Http404

    def get(self, request, pk, format=None):
        form = self.get_object(pk)
        serializer = FormSerializer(form)
        return Response(serializer.data)


class FormResponseSerializer(ModelSerializer):
    class Meta:
        model = FormResponse
        fields = "__all__"

    def create(self, validated_data):
        return


class ApiFormResponseDetail(APIView):
    def get_object(self, pk):
        try:
            return FormResponse.objects.get(token=pk)
        except FormInstance.DoesNotExist:
            raise Http404

    def get(self, request, pk, format=None):
        form = self.get_object(pk)
        serializer = FormResponseSerializer(form)
        return Response(serializer.data)

    def post(self, request, format=None, **kwargs):
        print(request.data)
        serializer = FormResponseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

