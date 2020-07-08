$(document).foundation();

// Vue.http.options.emulateJSON = true;

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
  rules: [{
    event: "",
    conditions: {}
  }]
};

var loadingSlide = {
  schema: {
    title: "Loading...",
    slug: "loading",
    type: "object",
    properties: {},
    //nextButtonLabel: "This is the 'Next' button, click me to edit the text",
  },
  rules: [{
    event: "",
    conditions: {}
  }]
};

var locationSafariHelp = `
You may need to allow location access on your system settings before you can turn them on for Safari. To do this:

1. Open **System Preferences > Security & Privacy Preferences > Privacy > Location Services**.
2. To allow for changes, click the lock in the bottom left.
3. Check "Enable Location Services".
`;


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
    },
    hasDescription: function() {
      // returns True if the active slide has a description
      // used to check if the "Add description" button needs to be displayed
      if (!this.activeSlide || !this.activeSlide.schema.description) {
        return false;
      }
      if (this.activeSlide.schema.description.trim() === '' || typeof this.activeSlide.schema.description == 'undefined') {
        return false;
      }
      return true;
    },
    hasTitle: function() {
      // returns True if the active slide has a title
      // used to check if the "Add title" button needs to be displayed
      if (!this.activeSlide || !this.activeSlide.schema.title) {
        return false;
      }
      if (this.activeSlide.schema.title.trim() === '' || typeof this.activeSlide.schema.title == 'undefined') {
        return false;
      }
      return true;
    },
    orderedFields: function() {
      var fields = [];

      if (this.activeSlide.schema.slug in this.uischema) {
        for (var idx in this.uischema[this.activeSlide.schema.slug]['ui:order']) {
          var slug = this.uischema[this.activeSlide.schema.slug]['ui:order'][idx];
          var field = this.activeSlide.schema.properties[slug];
          if (field) {
            field.slug = slug;
            fields.push(field);
          }
        }
      } else {
        return Object.keys(this.activeSlide.schema.properties);
      }
      /*
      for (var idx in this.activeSlide.schema.ordering) {
        slug = this.activeSlide.schema.ordering[idx];
        var field = this.activeSlide.schema.properties[slug];
        field.slug = slug;
        fields.push(field);
      }
      */
      return fields;
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

              if (response.data.results[0].ui_schema_json) {
                vm.$set(vm.$data, 'uischema', response.data.results[0].ui_schema_json);
              } else {
                vm.$set(vm.$data, 'uischema', response.data.results[0].ui_schema_json);
              }
              for (var idx in vm.slides) {
                var slide = vm.slides[idx];
                if (!(slide.schema.slug in vm.uischema)) {
                  vm.$set(vm.$data.uischema, slide.schema.slug, {'ui:order': Object.keys(slide.schema.properties)});
                }
              }

              vm.activeSlide = vm.slides[0];
              vm.$set(vm.$data, 'activeFieldKeys', Object.keys(vm.activeSlide.schema.properties));
              vm.cleanup();
            })
            .catch(function (error) {
              console.log("getFormData - I get null");
              console.log(error);
            });
          });
        },
    sendFormData: function(close) {
      this.editingField = null;
      vm.cleanup();  // make sure everything is correct -.-
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
      if (idx === 0) {
        this.activeSlide = this.slides[1];
      } else {
        this.activeSlide = this.slides[idx - 1];
      }
      var slug = this.slides[idx].schema.slug;
      delete this.uischema[slug];
      if ('ui:order' in this.uischema && slug in this.uischema['ui:order']) {
        delete this.uischema['ui:order'][slug];
      }
      this.slides.splice(idx, 1);
      this.cleanup();
    },
    addSlide: function(ev) {
      ev.preventDefault();
      // make a deep copy of the default new slide
      var newSlide = JSON.parse(JSON.stringify( defaultNewSlide ));
      var slideSlug = 'slide-' + (Math.floor(Math.random() * 900) + 100);
      newSlide.schema.slug = slideSlug;
      for (var prop in newSlide.schema.properties) {
        newSlide.schema.properties[newSlide.schema.slug + '-' + prop] = newSlide.schema.properties[prop];
        delete newSlide.schema.properties[prop];
      }
      this.slides.push(newSlide);
      this.$set(this.uischema, slideSlug, {'ui:order': Object.keys(newSlide.schema.properties)});
      this.selectSlide(newSlide);
      this.cleanup();
    },



    correctFinalSlide: function() {
      for (var idx in this.slides) {
        var slide = this.slides[idx];
        if ("final" in slide.schema) {
            delete slide.schema.final;
        }
      }
      var finalSlide = this.slides[this.slides.length-1]
      finalSlide.schema.final = true;
      finalSlide.rules = [{
        event: "summary",
        conditions: {}
      }];
    },
    correctConditions: function() {
      for (var idx in this.slides) {
        var slide = this.slides[idx];
        if ("conditions" in slide) {
          delete slide.conditions
        }
        var nextSlide = this.slides[parseInt(idx) + 1];
        if (nextSlide) {
          slide.rules = [{
            event: nextSlide.schema.slug,
            conditions: {}
          }];
        }
      }
    },
    correctMissingProperties: function() {
      for (var idx in this.slides) {
        var slide = this.slides[idx];
        if (!slide.schema.slug in this.uischema) {
          this.$set(this.uischema, slide.schema.slug, {});
        }
        if (!'ui:order' in this.uischema[slide.schema.slug]) {
          this.$set(this.uischema[slide.schema.slug], 'ui:order', Object.keys(slide.schema.properties));
        }
        for (var slug in slide.schema.properties) {
          var field = slide.schema.properties[slug];
          if ('placeholder' in field) {
            if (!this.uischema[slide.schema.slug][slug]) {
              this.$set(this.uischema[slide.schema.slug], slug, {});
            }
            this.$set(this.uischema[slide.schema.slug][slug], 'ui:placeholder', field.placeholder);
          }
        }
        /*
        if (!('ordering' in slide.schema)) {
          this.$set(slide.schema, 'ordering', Object.keys(slide.schema.properties));
          console.log(slide.schema.ordering);
        }
        */
      }
    },
    cleanup: function() {
      this.correctFinalSlide();
      this.correctConditions();
      this.correctMissingProperties();
    },
    removeField: function(ev, fieldName) {
      ev.preventDefault();
      var slug = this.activeSlide.schema.slug;
      // remove the actual field from the schema
      Vue.delete(this.activeSlide.schema.properties, fieldName);
      if (this.uischema[slug]['ui:order'].indexOf(fieldName) > -1) {
        // remove this field from the ordering array
        var idx = this.uischema[slug]['ui:order'].indexOf(fieldName);
        this.uischema[slug]['ui:order'].splice(idx, 1);
      }
      if (this.uischema[slug].hasOwnProperty(fieldName)) {
        // remove all UI properties of this field
        Vue.delete(this.uischema[slug][fieldName]);
      }
      if (this.activeSlide.schema.required && this.activeSlide.schema.required.indexOf(fieldName) > -1) {
        // remove it from the required array
        var idx = this.activeSlide.schema.required.indexOf(fieldName);
        this.activeSlide.schema.required.splice(idx, 1);
      }

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
    updateSlideSlug: function(ev, slug) {
      var newSlug = ev.target.value;
      this.activeSlide.schema.slug = newSlug;

      // update the uischema with the new slug
      var o = this.uischema;
      var new_o = {};
      // go through properties and replace the key/value pair
      // https://stackoverflow.com/a/54959591/122400
      for (var i in o) {
          if (i == slug) {
            console.log(i + ' matches ' + slug);
            new_o[newSlug] = o[slug];
          } else {
            console.log(i + ' does not match ' + slug);
            new_o[i] = o[i];
          }
      }

      // ensure all event properties point to the new slug
      for (var idx in this.slides) {
        var slide = this.slides[idx];
        if (slide.rules[0].event == slug) {
          console.log('caught relevant event')
          slide.rules[0].event = newSlug;
        }
      }

      this.$set(this.$data, 'uischema', new_o);
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
      slug = this.activeSlide.schema.slug + '-' + slug + '-' + (Math.floor(Math.random() * 900) + 100);
      this.$set(this.activeSlide.schema.properties, slug, data);
      this.uischema[this.activeSlide.schema.slug]['ui:order'].push(slug);
      // this.activeSlide.schema.ordering.push(slug);

      // create uischema anyways
      if (!(this.activeSlide.schema.slug in this.uischema)) {
        // slide is not in uischema
        this.uischema[this.activeSlide.schema.slug] = {};
      }

      if (!(slug in this.uischema[this.activeSlide.schema.slug])) {
        // field is not yet in uischema
        this.$set(this.uischema[this.activeSlide.schema.slug], slug, uischema || {});
      }

      if (uischema) {
        // field is in uischema, merge objects
        Object.assign(this.uischema[this.activeSlide.schema.slug][slug], uischema);
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
        placeholder: "Edit this field's label to change its text.",
        title: "",
      }, {classNames: 'hidden-title',
          'ui:widget': 'oneLineWidget',
          'ui:options': { label: false }
      });
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
    addBooleanField: function() {
      this.addField("yes-no", {
        type: "boolean",
        title: "Here's a question, do you agree?",
        // enum: ["yes", "no"],
        enumNames: ["Yes", "No"],
      }, {"ui:widget": "buttonWidget"});
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
    addSignatureField: function() {
      this.addField("signature", {
        type: "string",
        title: "Your signature",
      }, {'ui:widget': 'signatureWidget'});
    },
    addLocationField: function() {
      this.addField("location", {
        type: "string",
        title: "Your location",
      }, {'ui:widget': 'locationWidget',
          'ui:location_button': 'Click to send your location',
          'ui:location_load': 'Determining your location...',
          'ui:location_success': 'Location found!',
          'ui:location_error': 'Error finding your location! Click to try again.',
          'ui:location_help_url': 'http://example.com'}
      );
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

    fillTitle: function() {
      this.$set(this.activeSlide.schema, 'title', "Click me to edit this title");
      // console.log(this.activeSlide.schema.title);
    },
    fillDescription: function() {
      this.$set(this.activeSlide.schema, 'description', "Click me to edit this description");
      // console.log(this.activeSlide.schema.description);
    },

    setRequiredField: function(ev) {
      // we already know the field being edited, so we just need to check the event state
      var slug = ev.target.name.replace('-required', '');
      if (ev.target.checked) {
        // add this slug to required array
        if (!('required' in this.activeSlide.schema)) {
          // no required array yet, create it
          this.activeSlide.schema.required = [];
        }
        if (!(this.activeSlide.schema.required.indexOf(slug) > -1)) {
          this.activeSlide.schema.required.push(slug);
        }
      } else {
        // remove slug from required array
        if (this.activeSlide.schema.required.indexOf(slug) > -1) {
          this.activeSlide.schema.required.splice(this.activeSlide.schema.required.indexOf(slug), 1);
        }
      }
    },
    setQuestion: function(ev) {
      var val = ev.target.value;
      var slideSlug = this.activeSlide.schema.slug;
      var slug = ev.target.name.replace('question', '');
      // create the 'ui:question' property for this field in uischema if needed
      if (!(slug in this.uischema[slideSlug])) {
        this.$set(this.uischema[slideSlug], slug, {});
      }
      
      this.$set(this.uischema[slideSlug][slug], 'ui:question', val);
      this.$set(this.uischema[slideSlug][slug], 'ui:title', val);
    },

    getFieldType: function(field) {
      if (this.getFieldWidget(field.slug) == 'oneLineWidget') { return 'oneline'; }
      if (field.type == 'boolean') { return 'boolean'; }
      if (field.type == 'integer' || field.type == 'number') { return 'number'; }
      if (field.type == 'array') { return 'checkboxes'; }

      if (field.type == 'string') {
        if (field.format == 'email') { return 'email'; }
        if (field.format == 'date') { return 'date'; }
        if (this.getFieldWidget(field.slug) == 'textarea') { return 'longtext'; }
        if (this.getFieldWidget(field.slug) == 'signatureWidget') { return 'signature'; }
        if (this.getFieldWidget(field.slug) == 'locationWidget') { return 'location'; }
        if (this.getFieldWidget(field.slug) == 'radio') { return 'radio'; }
        if (field.format == 'data-url') {
          if (this.getFieldWidget(field.slug) == 'imageUpload') { return 'imageupload'; }
          return 'fileupload';
        }
        if (field.enum && !this.getFieldWidget(field.slug)) { return 'dropdown'; }
        return 'text';
      }
      console.log('Unrecognized field');
      console.log(field);
      return '';
    },

    ceEdit: function(ev, target, property) {
      // edit ContentEditable element
      var value = ev.target.innerText.replace(/\n/g, ' ');
      // console.log(value);
      this.$set(target, property, value);
      // console.log(this.activeSlide.schema.nextButtonLabel);
    },
    cePressEnter: function(ev, target, property) {
      // press enter in ContentEditable element = save
      console.log('enter pressed');
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
