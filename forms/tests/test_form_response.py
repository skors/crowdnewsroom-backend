from django.test import TestCase

from forms.tests.factories import FormResponseFactory


class FormReponseTest(TestCase):
    def setUp(self):
        self.response = FormResponseFactory.create()

        form_instance = self.response.form_instance
        form_instance.form_json = [{"schema": {
            "name": "Step 1",
            "slug": "step-1",
            "properties": {
                "files": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "format": "data-url"
                    }
                }
            }
        }
        }]
        form_instance.save()

    def test_multiple_files(self):
        self.response.json = {"files": ["data-url:base64...", "data-url:base64..."]}
        self.response.save()
        form = self.response.form_instance.form
        base_url = '/forms/admin/investigations/{}/forms/{}'.format(form.investigation.slug, form.slug)
        url_template = '{}/responses/{{}}/files/files/{{}}'.format(base_url)
        expected = [
            {'title': 'files',
             'type': 'link',
             'value': url_template.format(self.response.id, 0)},
            {'title': 'files',
             'type': 'link',
             'value': url_template.format(self.response.id, 1)}
        ]
        self.assertListEqual(list(self.response.rendered_fields()), expected)

    def test_multiple_files_without_files(self):
        self.response.json = {}
        self.response.save()

        expected = []
        self.assertListEqual(list(self.response.rendered_fields()), expected)
