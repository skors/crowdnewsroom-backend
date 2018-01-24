from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('investigations/<int:investigation_id>/forms/<int:form_id>', views.form, name="form"),
    path('investigations/<int:investigation_id>/forms/<int:form_id>/responses', views.form_response, name="form_response"),
]
