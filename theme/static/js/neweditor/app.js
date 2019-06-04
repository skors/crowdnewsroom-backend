$(document).foundation();

// Vue.http.options.emulateJSON = true;

// TODO:
// - required fields

var defaultNewSlide = {
  schema: {
    title: "New slide",
    description: "I'm a new slide, fill me!",
    slug: "new-slide",
    type: "object",
    properties: {
      dummy: {
        type: "string",
        title: "New field"
      },
    },
    nextButtonLabel: "This is the 'Next' button, click me to edit the text",
  },
  conditions: {}
};

var loadingSlide = {
  schema: {
    title: "Loading...",
    slug: "loading",
    type: "object",
    properties: {},
    //nextButtonLabel: "This is the 'Next' button, click me to edit the text",
  },
  conditions: {}
};;


var vm = new Vue({
  el: '#editor',
  name: 'editor',
  delimiters: ['${', '}'],
  data: {
    slides: [],
    uischema: [],
    activeSlide: loadingSlide,
    activeFieldKeys: [],
    editingField: null,
    formSlug: null,
    formId: null,
    postUrl: null,
    doneUrl: null,
  },
  mounted: function() {
    this.getFormData();
  },
  computed: {
    isFirstSlide: function() {
      if (this.slides && this.activeSlide) {
        if (this.slides.indexOf(this.activeSlide) === 0) {
          return true;
        }
      }
      return false;
    },
    isLastSlide: function() {
      if (this.slides && this.activeSlide) {
        if (this.slides.indexOf(this.activeSlide) == this.slides.length - 1) {
          return true;
        }
      }
      return false;
    }
  },
  methods: {
    getFormData : function () {
      // form_slug is given in the HTML template, and set in a <script> tag there
      axios.get('/forms/forms/' + form_slug)
        .then(function (response) {
          vm.$set(vm.$data, 'formId',  response.data.id);
          vm.$set(vm.$data, 'postUrl', '/forms/forms/' + vm.formId + '/form_instances?limit=1');
          vm.$set(vm.$data, 'doneUrl', '/forms/admin/investigations/' + inv_slug + '/interviewers/' + form_slug + '#/form_instance');
          var form = document.getElementById('editor-hidden-form');
          axios.get(vm.postUrl)
            .then(function (response) {
              formjson = response.data.results[0].form_json;
              vm.$set(vm.$data, 'slides', response.data.results[0].form_json);
              vm.$set(vm.$data, 'uischema', response.data.results[0].ui_schema_json);
              vm.activeSlide = vm.slides[0];
              vm.$set(vm.$data, 'activeFieldKeys', Object.keys(vm.activeSlide.schema.properties));
              this.correctFinalSlide();
              console.log(vm.activeSlide);
              console.log(vm.activeFieldKeys);
            })
            .catch(function (error) {
              this.message = "getFormData - I get null";
            });
          });
        },
    sendFormData: function(close) {
      this.editingField = null;
      var formData = new FormData(document.getElementById('editor-hidden-form'));
      axios.post(this.postUrl, formData)
        .then(function (response) {
          if (response.status === 201) {
            console.log(JSON.stringify(vm.slides[0].schema.properties));
            if (close) {
              window.location.href = vm.doneUrl;
            }
          } else {
            console.log('Error posting form data!!');
            console.log(response);
          }
        });
    },

    removeSlide: function(ev, idx) {
      ev.preventDefault();
      this.slides.splice(idx, 1);
      this.correctFinalSlide();
    },
    addSlide: function(ev) {
      ev.preventDefault();
      // make a deep copy of the default new slide
      var newSlide = Object.assign({}, defaultNewSlide);
      var slideSlug = 'slide-' + Math.floor(Math.random() * 100) + 100;
      this.slides.push(newSlide);
      this.selectSlide(newSlide);
      this.correctFinalSlide();
    },
    correctFinalSlide: function() {
      for (var idx in this.slides) {
        var slide = this.slides[idx];
        if ("final" in slide) {
            delete slide.final;
        }
      }
      this.slides[this.slides.length-1].final = true;
    },
    /*
    addFieldToSlide: function(ev, idx) {
      ev.preventDefault();
      var fieldSlug = 'field-' + Math.floor(Math.random() * 100) + 100;
      // make a deep copy of the default new field
      var newField = Object.assign({}, defaultNewField);
      this.model.properties[fieldSlug] = newField;
      this.model.slides[idx].fields.push(fieldSlug);
    },
    */
    removeField: function(ev, fieldName) {
      ev.preventDefault();
      Vue.delete(this.activeSlide.schema.properties, fieldName);
    },
    updateRequiredField: function(ev, fieldName) {
      console.log(ev);
    },
    updateFieldSlug: function(ev, fieldName) {
      var oldSlug = fieldName;
      var newSlug = ev.target.value;
      // go through properties and replace the key/value pair
      // https://stackoverflow.com/a/54959591/122400
      var o = this.activeSlide.schema.properties;
      var new_o = {};
      for (var i in o) {
          if (i == oldSlug) {
            new_o[newSlug] = o[oldSlug];
          } else {
            new_o[i] = o[i];
          }
      }
      this.$set(this.activeSlide.schema, 'properties', new_o);
      this.editingField = newSlug;
      if (this.getFieldWidget(oldSlug)) {
        // get value from old field
        var val = this.uischema[this.activeSlide.schema.slug][oldSlug];
        // create new property with new slug
        this.$set(this.uischema[this.activeSlide.schema.slug], newSlug, val);
        // delete the old property
        delete this.uischema[this.activeSlide.schema.slug][oldSlug];
      }
      if (this.activeSlide.schema.required && oldSlug in this.activeSlide.schema.required) {
        this.activeSlide.schema.required.splice(this.activeSlide.schema.required.indexOf(oldSlug), 1, newSlug);
      }
    },

    onFieldReorder: function(ev) {
      var updatedProperties = {};
      for (var prop in this.activeFieldKeys) {
        var value = this.activeSlide.schema.properties[this.activeFieldKeys[prop]];
        updatedProperties[this.activeFieldKeys[prop]] = value;
      }
      this.$set(this.activeSlide.schema, 'properties', updatedProperties);
      console.log(JSON.stringify(this.slides));
    },
    selectSlide: function(slide) {
      this.$set(this.$data, 'activeSlide', slide);
    },
    selectSlideByTitle: function(slideTitle) {
      var result = this.model.slides.find(function( slide ) {
        return slide.title === slideTitle;
      });
      this.$set(this.$data, 'activeSlide', slide);
    },
    selectPrevSlide: function() {
      var slide = this.slides[this.slides.indexOf(this.activeSlide) - 1];
      this.$set(this.$data, 'activeSlide', slide);
    },
    selectNextSlide: function() {
      var slide = this.slides[this.slides.indexOf(this.activeSlide) + 1];
      this.$set(this.$data, 'activeSlide', slide);
    },

    getFieldWidget: function(fieldName) {
      // if a specific widget is specified in the UI Schema, return its name
      if (!(this.activeSlide.schema.slug in this.uischema)) {
        return null;
      }
      if (!(fieldName in this.uischema[this.activeSlide.schema.slug])) {
        return null;
      }
      if (!('ui:widget' in this.uischema[this.activeSlide.schema.slug][fieldName])) {
        return null;
      }
      return this.uischema[this.activeSlide.schema.slug][fieldName]['ui:widget'];
    },

    addField: function(slug, data, uischema) {
      // TODO: check if slug exists, change if it does
      slug = slug + '-' + Math.floor(Math.random() * 100) + 100;
      this.$set(this.activeSlide.schema.properties, slug, data);

      if (uischema) {
        if (!(this.activeSlide.schema.slug in this.uischema)) {
          // slide is not in uischema
          this.uischema[this.activeSlide.schema.slug] = {};
        }

        if (!(slug in this.uischema[this.activeSlide.schema.slug])) {
          // field is not yet in uischema
          this.$set(this.uischema[this.activeSlide.schema.slug], slug, uischema);
        } else {
          // field is in uischema, merge objects
          Object.assign(this.uischema[this.activeSlide.schema.slug][slug], uischema);
        }
      }
    },
    addTextInputField: function() {
      this.addField("text-input", {
        type: "string",
        title: "Text",
      });
    },
    addOneLineField: function() {
      this.addField("one-line", {
        type: "string",
        title: "Edit this field's title to change this text.",
      }, {classNames: 'hidden-title',
          'ui:widget': 'oneLineWidget'});
    },
    addTextAreaField: function() {
      var slug = "text-area";
      this.addField(slug, {
        type: "string",
        title: "Comments",
      }, {'ui:widget': 'textarea'});
    },
    addEmailInputField: function() {
      this.addField("email-input", {
        type: "string",
        format: "email",
        title: "Email",
      });
    },
    addFileUploadField: function() {
      this.addField("file-input", {
        type: "string",
        format: "data-url",
        title: "File upload",
      });
    },
    addImageUploadField: function() {
      this.addField("image-input", {
        type: "string",
        format: "data-url",
        title: "Image upload",
      }, {'ui:widget': 'imageUpload'});
    },

    addCheckboxField: function() {
      this.addField("checkbox", {
        type: "array",
        title: "Multiple choice",
        items: {
          type: "string",
          enum: ["One", "Two", "Three"]
        },
        uniqueItems: true
      }, {"ui:widget": "checkboxes"});
    },
    addRadioField: function() {
      this.addField("radio", {
        type: "string",
        title: "Radio choice",
        enum: ["Crowd", "News", "Room"]
      }, {"ui:widget": "radio"});
    },
    addDropdownField: function() {
      this.addField("dropdown", {
        type: "string",
        title: "Dropdown choice",
        enum: ["Crowd", "News", "Room"]
      });
    },
    addDateField: function() {
      this.addField("date", {
        type: "string",
        format: "date",
        title: "Date",
      });
    },
    addBooleanField: function() {
      this.addField("date", {
        type: "string",
        format: "date",
        title: "Date",
      });
    },

    removeOption: function(field, idx) {
      if ('items' in field) {
        field.items.enum.splice(idx, 1);
      } else {
        field.enum.splice(idx, 1);
      }
    },
    addOption: function(field) {
      if ('items' in field) {
        field.items.enum.push('New option');
      } else {
        field.enum.push('New option');
      }
    },

    ceEdit: function(ev, target, property) {
      // edit ContentEditable element
      this.$set(target, property, ev.target.innerText.replace(/\n/g, ' '));
    },
    cePressEnter: function(ev, target, property) {
      // press enter in ContentEditable element = save
      ev.preventDefault();
      this.ceEdit(ev, target, property);
      ev.target.blur();
    },
    ceButtonEdit: function(ev, choice) {
      choice.label = ev.target.innerText;
    },
    ceButtonPressEnter: function(ev, choice) {
      ev.preventDefault();
      choice.label = ev.target.innerText.replace(/\n/g, ' ');
      ev.target.blur();
    },


    buttonClicked: function(ev) {
      // this deals with the Space key firing the onClick event
      // we want it to add an actual space
      // FIXME: multiple spaces don't work
      ev.preventDefault();
      if (!ev.x && !ev.y && !ev.clientX && !ev.clientY) {
        // it's a space press, not a mouse click
        insertHtmlAtCursor(' ');
      }
    }

    /*
    // catch form input values -- this ensures we also submit the csrf_token field
    var postdata = {};
    for (var i=0; i<ev.target.elements.length; i++) {
      var el = ev.target.elements[i];
      if (el.name) {
        postdata[el.name] = el.value;
      }
    }
    this.$http.post(setTutorialURL, postdata).then(function (response) {
      this.$refs.tutorialFormStatus.innerText = "Saved!";
    }, function (response) {
      this.$refs.tutorialFormStatus.innerText = "Error when saving :-(";
    });
    */
  }
});
