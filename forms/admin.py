from django.contrib import admin
from django import forms
from django.utils.safestring import mark_safe

from .models import Investigation, Form, FormResponse


class FRForm(forms.ModelForm):
    class Meta:
        model = FormResponse
        exclude = ["json"]


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
            content += "<img src={}></img>".format(form_data[name])
        elif props["type"] == "boolean":
            content += "Yes" if form_data[name] else "No"
        else:
            content += form_data[name]
        response += "<tr><th>{}</th><td>{}</td></tr>".format(props["title"], content)
    response += "</table>"

    return mark_safe(response)


rendered_response.short_description = "Form Data"


class FormResponseAdmin(admin.ModelAdmin):
    readonly_fields = (rendered_response, "form")
    exclude = ["reply"]


admin.site.register(Form)
admin.site.register(Investigation)
admin.site.register(FormResponse, FormResponseAdmin)
