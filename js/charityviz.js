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

			var map;

			// Setup the modal 
			$this.attr('data-target', '#'+project.get('id'));
			$this.attr('data-toggle', 'modal');

			var sparql = new SPARQL.Service(url);
			sparql.setPrefix('foaf', "http://xmlns.com/foaf/0.1/");
			sparql.setPrefix('dct', "http://purl.org/dc/terms/");
			sparql.setPrefix('rdfs', 'http://www.w3.org/2000/01/rdf-schema#');
			sparql.setPrefix('owl', 'http://www.w3.org/2002/07/owl#');
			sparql.setPrefix('dc', 'http://purl.org/dc/elements/1.1/');
			sparql.setPrefix('skos', 'http://www.w3.org/2004/02/skos/core#');
			
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
							if (json.results.bindings.length === 0) {
								return;
							};
							var countryCode, lonLat = [0,0];
							if (json.results.bindings[0].recipientCountry) {
								countryCode = json.results.bindings[0].recipientCountry.value.substr(-2, 2);
								lonLat = countryCodeMap[countryCode];
							};

							project.set({
								description: json.results.bindings[0].description.value,
								title: json.results.bindings[0].title.value,
							});

							if (json.results.bindings[0].contactInfo) {
								var obj = json.results.bindings[0];
								var address = {};
								address.name = obj.contactTitle.value;
								address.address = obj.contactAddress.value;
								address.email = obj.contactEmail.value;
								address.person = obj.contactPerson.value;
								address.phone = obj.contactPhone.value;
								project.set({address:address});
							};

							function hideHover() {
								var mapEl = projectPopover.$el.find('.map');
								if(map) { map.destroy(); }
								mapEl.empty();
								$($this).popover('hide');
							}

							function showHover() {
								// Set up map
								var ll = new OpenLayers.LonLat(lonLat[1],lonLat[0]);
								var mapEl = projectPopover.$el.find('.map');
								var map = new OpenLayers.Map(mapEl.get(0), {
									controls:[]
								});
								var mapnik         = new OpenLayers.Layer.OSM();
								var fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
								var toProjection   = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection
								var position       = ll.transform( fromProjection, toProjection);
								var zoom           = 4; 
								map.addLayer(mapnik);
								map.setCenter(position, zoom);

								var markers = new OpenLayers.Layer.Markers("Markers");
								map.addLayer(markers);
								var size = new OpenLayers.Size(21,25);
								var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
								var icon = new OpenLayers.Icon('http://www.openlayers.org/dev/img/marker.png', size, offset);
								markers.addMarker(new OpenLayers.Marker(ll,icon));
								markers.addMarker(new OpenLayers.Marker(ll,icon.clone()));
							}

							$this.popover({
								title: project.get('title'),
								content: projectPopover.el
							}).on('mouseenter', showHover).on('mouseleave', hideHover);

							$('#'+project.get('id')).on('show', function() {
								$this.off('mouseenter', showHover).off('mouseleave', hideHover);
								hideHover();
								var proj_id = project.get('id');
								queryParticipant(proj_id);
								queryTransactions(proj_id);
							}).on('hidden', function() {
								$this.on('mouseenter', showHover).on('mouseleave', hideHover);
							});

						},
						failure: function() {
							console.log('Error retrieving project');
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

			function queryTransactions(id) {
				query.query(
					Handlebars.compile($('#transaction-retrieve-sparql-template').html())({project_id:id}),
					{
						success: function(json) {
							console.log(json);
							var transactions = [];
							for (var i = 0; i < json.results.bindings.length; i++) {
								var t = json.results.bindings[i];
								transactions.push({
									description:t.description.value,
									provider: (t.providerTitle.value != "") ? t.providerTitle.value : null,
									receiver: (t.receiverTitle.value != "") ? t.receiverTitle.value : null,
									date: t.date.value,
									amount: Math.abs(parseInt(t.value.value))
								});
							};
							project.set({transactions:transactions});
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
