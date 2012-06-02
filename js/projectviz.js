(function( $ ){

	var Project = Backbone.Model.extend({});

	// Templates
	var projectViewTemplate = Handlebars.compile($('#project-view-template').html());
	var projectPopoverTemplate = Handlebars.compile($('#project-popover-template').html());

	var ProjectView = Backbone.View.extend({
		template: projectViewTemplate,

		initialize: function() {
			this.model.on('change', this.render, this);
		},

		render: function() {
			var attributes = this.model.toJSON();
			this.$el.html(this.template(attributes));
			return this;
		},
	});

	var ProjectPopover = Backbone.View.extend({
		template: projectPopoverTemplate,

		initialize: function() {
			this.model.on('change', this.render, this);
		},

		render: function() {
			var attributes = this.model.toJSON();
			this.$el.html(this.template(attributes));
			return this;
		},
	});

  $.fn.projectViz = function( url ) {  

		return this.each(function() {
			var $this = $(this);

			var project = new Project();
			project.set({id:$this.attr('data-iati')});
			$('body').append('<div class="modal fade" id="' + project.get('id') + '"></div>');

			// Setup the popover view
			var projectPopover = new ProjectPopover({
				model:project
			}).render();

			// Setup the full project view
			var projectView = new ProjectView({
				model:project,
				el:$('#'+project.get('id'))
			}).render();

			// Setup the modal 
			$this.attr('data-target', '#'+project.get('id'));
			$this.attr('data-toggle', 'modal');

			var sparql = new SPARQL.Service(url);
			sparql.setPrefix('foaf', "http://xmlns.com/foaf/0.1/");
			sparql.setPrefix('dct', "http://purl.org/dc/terms/");
			sparql.setPrefix('rdfs', 'http://www.w3.org/2000/01/rdf-schema#');
			sparql.setPrefix('owl', 'http://www.w3.org/2002/07/owl#');
			sparql.setPrefix('dc', 'http://purl.org/dc/elements/1.1/');
			
			sparql.setPrefix('iati', 'http://tools.aidinfolabs.org/linked-iati/def/iati-1.01#');
			sparql.setPrefix('activity', 'http://data.kasabi.com/dataset/iati/activity/');
			
			sparql.setOutput('json');
			sparql.setMethod('POST');

			var query = sparql.createQuery();
			queryProject(project.get('id'));

			function queryProject(id) {
				query.query(
					Handlebars.compile($('#project-retrieve-sparql-template').html())({project_id:id}),
					{
						success: function(json) {
							project.set({
								description: json.results.bindings[0].description.value,
								title: json.results.bindings[0].title.value
							});
							$this.popover({
								title: project.get('title'),
								content: projectPopover.el
							});
							$('#'+project.get('id')).on('show', function() {
								$($this).popover('hide');
								var proj_id = project.get('id');
								queryParticipant(proj_id);
								queryProviders(proj_id);
								queryReceivers(proj_id);
							});
						},
						failure: function() {
							console.log('Error retrieving project');
						}
					}
				);
			}
			
			function queryProviders(id) {
				query.query(
					Handlebars.compile($('#provider-retrieve-sparql-template').html())({project_id:id}),
					{
						success: function(json) {
							console.log("Providers:");
							console.log(json);
						},
						failure: function() {
							console.log('Error retrieving providers');
						}
					}
				);
			}

			function queryReceivers(id) {
				query.query(
					Handlebars.compile($('#receiver-retrieve-sparql-template').html())({project_id:id}),
					{
						success: function(json) {
							console.log("Receivers:");
							console.log(json);
						},
						failure: function() {
							console.log('Error retrieving receivers');
						}
					}
				);
			}

			function queryParticipant(id) {
				query.query(
					Handlebars.compile($('#participant-retrieve-sparql-template').html())({project_id:id}),
					{
						success: function(json) {
							project.set({
								organisations:json.results.bindings.length
							});
						},
						failure: function() {
							console.log('Error retrieving participants');
						}
					}
				);
			}			

  	});

  };
})( jQuery );
