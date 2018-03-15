import datetime

from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.http import JsonResponse
from guardian.shortcuts import get_objects_for_user
from rest_framework import generics, serializers
from rest_framework.serializers import ModelSerializer

from .models import FormResponse, FormInstance


class FormSerializer(ModelSerializer):
    class Meta:
        model = FormInstance
        fields = "__all__"


class FormInstanceDetail(generics.RetrieveAPIView):
    serializer_class = FormSerializer
    lookup_url_kwarg = "form_id"

    def get_object(self, *args, **kwargs):
        form_id = self.kwargs.get("form_id")
        return FormInstance.get_latest_for_form(form_id)


class FormResponseSerializer(ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = FormResponse
        read_only_fields = ("submission_date", "id")
        fields = ("json", "email", "form_instance") + read_only_fields + ("password",)

    def create(self, validated_data, *args, **kwargs):
        password = validated_data.pop("password")

        fr = FormResponse(**validated_data)
        fr.submission_date = datetime.datetime.now()
        fr.save()
        fr.set_password_for_user(password)
        return fr


class ApiFormResponseDetail(generics.UpdateAPIView):
    queryset = FormResponse
    serializer_class = FormResponseSerializer
    lookup_field = "id"


class FormResponseListCreate(generics.ListCreateAPIView):
    queryset = FormResponse
    serializer_class = FormResponseSerializer

    def get_queryset(self):
        responses = get_objects_for_user(self.request.user, "edit_response", FormResponse)
        responses = responses.filter(form_instance__form_id=self.kwargs["form_id"])
        return responses

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

    def check_object_permissions(self, request, obj):
        has_permission = request.user.has_perm("edit_response", obj)
        if not has_permission:
            self.permission_denied(
                request, message='NOT allowed!'
            )


def user_detail_view(*args, **kwargs):
    try:
        UserModel = get_user_model()
        UserModel.objects.get(email=kwargs.get("email"))
        return JsonResponse({"exists": True})
    except ObjectDoesNotExist:
        return JsonResponse({"exists": False}, status=404)
