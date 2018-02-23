from django.urls import path

from forms import admin_views
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('investigations/<int:investigation_id>/forms/<int:form_instance_id>', views.form, name="form"),
    path('investigations/<int:investigation_id>/forms/<int:form_instance_id>/responses', views.form_response, name="form_response"),
    path('responses/<token>', views.form_data, name="form_data"),
    path('admin/investigations', admin_views.list_investigations),
    path('admin/investigations/<int:investigation_id>/responses', admin_views.list_responses, name="investigation_responses"),
    path('admin/investigations/<int:investigation_id>/responses/<int:form_response_id>', admin_views.edit_response, name="response_details")
]
