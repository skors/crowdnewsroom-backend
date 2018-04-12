from django.test import TestCase
from django.utils.text import slugify

from forms.models import Investigation, Form, FormInstance
from forms.utils import _get_file_keys


class Utils(TestCase):
    def setUp(self):
        investigation_name = "First Investigation"
        investigation = Investigation.objects.create(name=investigation_name, slug=slugify(investigation_name))

        form_name = "First Form"
        self.form = Form.objects.create(name=form_name,
                                   slug=slugify(form_name),
                                   investigation=investigation)

    def test_get_file_keys_finds_file(self):
        form_instance = FormInstance.objects.create(form=self.form,
                                                    form_json=[{
                                                        "schema": {
                                                            "slug": "first",
                                                            "properties": {
                                                                "string": {"type": "string"},
                                                                "file": {"type": "string",
                                                                         "format": "data-url"}
                                                            }
                                                        }
                                                    }])

        expected = {"file"}
        file_keys = _get_file_keys(form_instance)
        self.assertEqual(file_keys, expected)


    def test_get_file_keys_finds_file_array(self):
        form_instance = FormInstance.objects.create(form=self.form,
                                                    form_json=[{
                                                        "schema": {
                                                            "slug": "first",
                                                            "properties": {
                                                                "files": {
                                                                    "type": "array",
                                                                    "items": {
                                                                        "type": "string",
                                                                        "format": "data-url"
                                                                    }
                                                                },
                                                            }
                                                        }
                                                    }])

        expected = {"files"}
        file_keys = _get_file_keys(form_instance)
        self.assertEqual(file_keys, expected)

    def test_get_file_keys_finds_signature(self):
        form_instance = FormInstance.objects.create(form=self.form,
                                                    form_json=[{
                                                        "schema": {
                                                            "slug": "first",
                                                            "properties": {
                                                                "signature": {"type": "string"},
                                                            }
                                                        }
                                                    }],
                                                    ui_schema_json={
                                                        "first": {
                                                            "signature": {
                                                                "ui:widget": "signatureWidget"
                                                            }
                                                        }
                                                    })

        expected = {"signature"}
        file_keys = _get_file_keys(form_instance)
        self.assertEqual(file_keys, expected)