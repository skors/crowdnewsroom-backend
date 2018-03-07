from django.contrib import admin
from django import forms
from django.contrib.postgres import fields
from django.utils.safestring import mark_safe
from django_json_widget.widgets import JSONEditorWidget
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.utils.translation import ugettext_lazy as _

from .models import User, Investigation, Form, FormResponse, FormInstance, Partner


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    """Define admin model for custom User model with no email field."""

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser',
                                       'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
    )
    list_display = ('email', 'first_name', 'last_name', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)


def rendered_response(obj: FormResponse):
    data = obj.json
    form_data = data["formData"]
    ui_schema = data["uiSchema"]
    properties = data["schema"]["properties"]

    # TODO: This is a pure POV and extremely prone to XSS attacks.
    # Refactor with a proper templating library or replace.

    response = "<table>"
    for (name, props) in properties.items():
        content = ""
        if ui_schema.get(name, dict()).get("ui:widget") == "signatureWidget":
            content += "<img src={}></img>".format(form_data.get(name))
        elif props["type"] == "boolean":
            content += "Yes" if form_data.get(name) else "No"
        else:
            content += form_data.get(name, "")
        response += "<tr><th>{}</th><td>{}</td></tr>".format(props["title"], content)
    response += "</table>"

    return mark_safe(response)


rendered_response.short_description = "Form Data"


class FormResponseAdmin(admin.ModelAdmin):
    readonly_fields = (rendered_response, "form")
    exclude = ["reply"]


class FormAdmin(admin.ModelAdmin):
    formfield_overrides = {
        fields.JSONField: {'widget': JSONEditorWidget}
    }


admin.site.register(Form, FormAdmin)
admin.site.register(Investigation)
admin.site.register(FormResponse, FormResponseAdmin)
admin.site.register(Partner)
admin.site.register(FormInstance)
