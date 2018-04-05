import datetime

from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.http import JsonResponse, Http404
from guardian.shortcuts import get_objects_for_user
from rest_framework import generics, serializers
from rest_framework.serializers import ModelSerializer

from .models import FormResponse, FormInstance, Investigation


class InvestigationSerializer(ModelSerializer):
    class Meta:
        model = Investigation
        fields = "__all__"


class InvestigationDetail(generics.RetrieveAPIView):
    # TODO: This should filter to make sure to only return
    # Investigations that are published and not in draft or unlisted state
    queryset = Investigation
    serializer_class = InvestigationSerializer
    lookup_url_kwarg = "investigation_slug"
    lookup_field = "slug"


class FormSerializer(ModelSerializer):
    class Meta:
        model = FormInstance
        fields = "__all__"


class FormInstanceDetail(generics.RetrieveAPIView):
    serializer_class = FormSerializer
    lookup_url_kwarg = "form_slug"

    def get_object(self, *args, **kwargs):
        form_slug = self.kwargs.get("form_slug")
        form_instance = FormInstance.get_latest_for_form(form_slug)
        if form_instance is None:
            raise Http404
        return form_instance


class FormResponseSerializer(ModelSerializer):
    class Meta:
        model = FormResponse
        read_only_fields = ("submission_date", "id", "status", "redirect_url")
        fields = ("json", "form_instance") + read_only_fields

    def create(self, validated_data, *args, **kwargs):
        fr = FormResponse(**validated_data)
        fr.submission_date = datetime.datetime.now()
        fr.save()
        return fr


class FormResponseListCreate(generics.CreateAPIView):
    queryset = FormResponse
    serializer_class = FormResponseSerializer
