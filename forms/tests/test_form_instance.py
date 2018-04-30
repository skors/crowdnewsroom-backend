import sys
from unittest.mock import patch, PropertyMock

from django.test import TestCase
from django.utils import timezone
from django.utils.translation import activate

from forms.models import Investigation, Form, FormInstance, FormResponse, generate_emails
from forms.tests.factories import FormInstanceFactory


class FormInstanceTestCase(TestCase):
    def setUp(self):
        steps = [
            {
                "schema": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string"
                        }
                    }
                },
            },
            {
                "schema": {
                    "type": "object",
                    "properties": {
                        "email": {
                            "type": "string",
                            "format": "email"
                        }
                    }
                }
            }
        ]
        self.form_instance = FormInstanceFactory.create(form_json=steps)

    def test_json_properties(self):
        self.assertEqual(self.form_instance.json_properties, {"name", "email"})

    def test_flat_schema(self):
        expected = {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string"
                        },
                        "email": {
                            "type": "string",
                            "format": "email"
                        }
                    }
                }
        self.assertEqual(self.form_instance.flat_schema, expected)
