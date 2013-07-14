// Cartofolio module
define([
  // Application.
  "app",
  "modules/project",
  "modules/controls"
],

// Map dependencies from above array.
function(app, Project, Controls) {

  // Create a new module.
  var Cartofolio = app.module();


  // Default Model.
  Cartofolio.Model = Backbone.Model.extend({

  });

  Cartofolio.projects = new Project.Collection({}, {name: "all projects"});
  Cartofolio.elders = new Project.Collection({});
  _.extend(Cartofolio.elders, Backbone.Events);

  Cartofolio.extractElders = function() {
  	var elds = _(Cartofolio.projects.models).filter(function (model) {
		return model.get("parent") == 0;
	});
	Cartofolio.elders.reset(elds);
	Cartofolio.elders.trigger("greenlight");


/* 	app.mainrouter.navigate("debug", { trigger: true }); */
  }

  Cartofolio.Views = {};


/* ! ==== SKELETON VIEW ==== */


  Cartofolio.Views.Skeletonview = Backbone.Layout.extend({

	  template: "skeleton",
	  className: "skeleton",

	  collection: Cartofolio.elders,

	  projectgroup: {},
	  firstRender: true,

	  /* !skeleton init */
	  initialize: function(){
	  	_.bindAll(this);
	  },

	  afterRender: function() {
	  	var lay = this;

		if (lay.firstRender) {
			// if it's already been loaded, the reset won't ever fire, so just show it
			if (this.collection.length != 1) {
				lay.domsetup();
				lay.fadeprojects();
			}
			else {
				this.collection.on("reset", function () { // wait for the collection to be populated before showing
					console.log("elders reset (calling from skeleton view)");
					lay.domsetup();
					lay.fadeprojects();
				});
			}
		lay.firstRender = false;
		}
		else { // for resizes
			lay.domsetup();
			$(".skelback").show();
			$(".skelproj").show();
		}
	  },

	  domsetup: function () {
			var lay = this;

				/* reset the container to being visible if it was faded out */
				if (!$(".container").is(":visible")) $(".container").css("display", "block");

				_.each(Cartofolio.elders.models, function(model) { // append divs to the DOM

				lay.$el
					.append("<div class='skelback'><div class='skelproj' id='" + model.get("slug") + "'></div></div>");
					$("#" + model.get("slug")).css("background", 'url("' + model.get("thumbnail") + '") no-repeat center center')
						.css({
							"-webkit-background-size": "cover",
							"-moz-background-size": "cover",
							"-o-background-size": "cover",
							"background-size": "cover"
						});


					var date = app.fixDate(model);
					var materials = app.fixList(model, "materials");

					// add content
					$("#" + model.get("slug")).html('<h1>'+ model.get("title") + '</h1><h2>' + date + '</h2><h2>' + materials + '</h2>');
					$("#" + model.get("slug")).click(function () {
						var somerouter = new Backbone.Router({});
						somerouter.navigate('projects/' + model.get("slug"), {trigger:true});
					});
			});

			/* !---- mouse behavior stuff ---- */
			$(".skelback").mouseenter(function () {
				$(this).animate({"background-color": "rgba(0,0,0,0.7)"}, 100, "easeInQuad");
				$(this).children(".skelproj").animate({"color": "rgb(251,255,103)"}, 100, "easeInQuad");
			});
			$(".skelback").mouseleave(function () {
				$(this).animate({"background-color": "rgba(0,0,0,0.5)"}, 100, "easeInQuad");
				$(this).children(".skelproj").animate({"color": "white"}, 400, "easeInQuad");
			});
/* 			$(".skeleton").css("height", $(".container").height()+4 + "px"); */
	  },

	  fadeprojects: function () {
			var lay = this;
			lay.sizefix();
			/* !---- cyclical project fades ---- */
			var count = 0;
			(function shownext(jq){
				jq.eq(0).fadeIn(300, "easeInQuad", function(){
					$(".skelproj").eq(count).fadeIn(600, "easeInQuad");
					(jq=jq.slice(1)).length && shownext(jq);
					count++;
				});
			})($('div.skelback'));

	  },

	  sizefix: function () {},

  });


/* !==== MAP VIEW ==== */


  Cartofolio.Views.Mapview = Backbone.Layout.extend({

		template: "cartofolio",
		className: "cartofolio",


		projectgroup: {},
		parchment: {},
		prevW: $(window).width(),
		prevH: $(window).height(),
		xscale: '',
		yscale: '',
		w: '',
		h: '',
		x: '', y: '', ux: '', uy: '', pxmin: '', xmin: '', pymin: '', ymin: '', pxmax: '', xmax: '', pymax: '', ymax: '', axes: '', leader: '',
		lastX: 0,
		lastY: 0,
		firstRender: true,
		sidebar: 300,
		r: 10,
		s: 0,
		nodes: [],
		force: '',
		gravity: '',
		tick: '',
		collide: '',

		padding: 7,
		fadetime: 1000,

		bR: 30, // button radius

		ux: function(x){
				return (x)/this.s-75;
			},

		uy: function(y){
				return (y)/this.s-75;
			},

		// !events
		events: {
			"click .sortbutton" : "arrange"
		},

		sizefix: function () {			
			$("table.carto").css({
				"height": $(window).height()-$(".sidetop").height()
			});
			
			$("table.carto").css({
				"visibility": "visible",
				"display": "none"
			});
			
			$("table.carto").fadeIn(300, "easeInOutQuad");
		},

		
		/*  !cartofolio init	*/
		initialize: function () {
			_.bindAll(this);
			var cmp = this;
			d3.selection.prototype.moveToFront = function() {
			  return this.each(function(){
			  this.parentNode.appendChild(this);
			  });
			};
		},
		
		afterRender: function() {
		 	var cmp = this;
		 	
		 	
		 	
			if (cmp.firstRender) {
	
				cmp.w = $(window).width();
				cmp.h = $(window).height();
				cmp.s = 2*cmp.r/150;
				cmp.setbuffer();
				
				Cartofolio.elders.on("greenlight", function () {
/*
					console.log("done with the elders");
					console.log(_(Cartofolio.elders.models).map(function (model) {
						return model.get("title");
					}));
*/
					cmp.d3_dom(function () {
						cmp.temptype = app.maptype;
						cmp.arrange("random");
						cmp.arrange(cmp.temptype);
					});
				});
				
				if (Cartofolio.elders.length > 1) {
					console.log(_(Cartofolio.elders.models).map(function (model) {
						return model.get("title");
					}));
					cmp.d3_dom(function () {
						cmp.temptype = app.maptype;
						cmp.arrange("random");
						cmp.arrange(cmp.temptype);
					});
				}
	
				Cartofolio.projects.bind("all", cmp.d3_update);
	
				
				
				$(".container").css({
				 	"width": "100%",
				 	"height": "100%",
				 	"top": 0,
				 	"left": 0,
				 	"visibility": "visible",
				 	"display": "none"
			 	});
			 	
			 	$("cf-wrapper").css({
				 	"overflow": "hidden"
			 	});
			 	
			 	$(".container").fadeIn(600, "easeInOutQuad", function () {
				 	cmp.sizefix();
			 	});
			 	
				cmp.firstRender = false;
			}
	
			cmp.w = $(window).width();
			cmp.h = $(window).height();
			if (cmp.w >= cmp.h) {
				cmp.buffer = cmp.h/5;
			}
			else {
				cmp.buffer = cmp.w/5;
			}
			cmp.pxmin = cmp.buffer;
			cmp.pxmax = (cmp.w-cmp.buffer-cmp.sidebar);
			cmp.pymax = cmp.h-cmp.buffer;
			cmp.pymin = cmp.buffer;
			

		},



		d3_dom: function(callback) {
		var cmp = this;

		cmp.parchment = d3.select(".cf-wrapper").append("svg")
			.attr("class", "parchment")
			.attr("width", "100%")
			.attr("height", "100%")
			;

		// !---- buttons ----
		
		$(".cf-wrapper").append('<div class=sidebar></div>');
		$(".sidebar").css("width", cmp.sidebar + "px");
		
		$(".sidebar").append([
			"<div class='sidetop'><div class='homelogo'><a href='/'>sam galison</a></div><ul class='cartonav'></ul></div>",
			"<table class='carto'><tbody></tbody></table>"
			]);
		
		$("ul.cartonav").append([
			"<a	href='skeleton'><li id='skeleton'>	see projects in a list </li></a>",
			"<a	href='contact'>	<li id='contact'>	contact	</li></a>",
			"<a	href='resumes'>	<li id='resumes'>	resumé	</li></a>",
		]);
		
		var pieces = [
			["whether it's ongoing or completed", "active"	   			],
			["when it was made and how many hours it took",	"date"		],
			["what it's made of", "materials"					   		],
			["how i made it", "techniques"						   		],
			["how many dimensions it occupies",	"dimensions"	   		],
			["how big it is", "scale"							   		],
			["no logic at all", "random"						   		]
		];

		var wrapped = _(pieces).map(function (thing) {
			return "<tr class='sortlink' id='" + thing[1] + "'><td>" + thing[0] + "</td></tr>";
		});

		wrapped.unshift("<tr><th>~ sort by: ~</th></tr>");
		
		$("table.carto tbody").append(wrapped);
		
		$("tr.sortlink").on("click", function (e) {
			var nr = new Backbone.Router({});
			nr.navigate('cartofolio/' + e.currentTarget.id);
			cmp.arrange(e);
		});
		
		cmp.parchment.append("rect")
			.attr("class", "boundingbox")
			.attr("x",cmp.xmin)
			.attr("y",cmp.ymin)
			.attr("width",cmp.xmax-cmp.xmin)
			.attr("height",cmp.ymax-cmp.ymin)
			.attr("fill","none")
			.attr("stroke","black")
			;
		
		// !force

		cmp.force = d3.layout.force()
			.nodes(Cartofolio.elders.models)
			.on("tick", cmp.tick)
			.gravity(0)
			.friction(0.9)
			.start();


		// !nodes


		cmp.node = cmp.parchment.selectAll(".node")
				.data(Cartofolio.elders.models)
			.enter().append("g")
				.attr("class", "node")
				.attr("id", function (d) { return d.get("slug"); })
				.call(cmp.force.drag);

		cmp.orb = cmp.node.append("g")
			.attr("class","orb")
			;

		cmp.orb.append("circle")
			.attr("class", "orbcircle")
			.attr("r", cmp.r)
			;

		cmp.orb.append("clipPath")
					.attr("id", function(d) { return d.get("slug"); })
				.append("circle")
					.attr("class", "orbclip")
					.attr("r", cmp.r)
					;

		cmp.orb.append("g")
					.attr("class", "clip_group")
					.attr("clip-rule", "nonzero")
					.attr("id", function(d) { return d.get("slug") + "_to_clip"; })
					.attr("clip-path", function(d) { return "url(#" + d.get("slug") + ")"; })
				.append("image")
					.attr("x", cmp.ux(0))
					.attr("y", cmp.uy(0))
					.attr("width", 150)
					.attr("height", 150)
					.attr("transform", "scale(" + cmp.s + ")")
					.attr("xlink:href", function (d) { return d.get("thumbnail"); })
					;
		
		$("g.node").on("mouseenter", function () {
			var which = "";
			
			var label = d3.select(this).append("g")
					.attr("class", "label")
					.attr("id", function (d) { which = d.get("slug"); return d.get("slug"); })
					;
		
			var ltext = label.append("svg:text")
						.attr("x", function ( d ) { return cmp.r + 20 })
						.attr("y", function ( d ) {	return 0 })
						.attr("dy", "0.3em")
						.text(function (d) { return d.get("title"); })
						;
						
			var bbox = ltext.node().getBBox();
			
			label.insert("rect", ":first-child")
				.attr("x", bbox.x-10)
				.attr("y", bbox.y-5)
				.attr("width", bbox.width+20)
				.attr("height", bbox.height+10)
				;
			d3.select(this).moveToFront();
			$("g.label").fadeIn("fast");
				
			d3.selectAll("line.leader:not(." + which + ")")
				.transition(300)
				.style("stroke", "rgba(0,0,0,0.3)");
			
		});
		
		$("g.node").on("mouseleave", function () {
			var which = "";
			d3.select(this)
				.attr("id",function (d) { which = d.get("slug"); })
				;
				
			$("g.label").fadeOut("fast", function () {
				$(this).remove();
			});
			d3.selectAll("line.leader:not(." + which + ")")
				.transition(300)
				.style("stroke", "rgba(0,0,0,1)");
		});
		
		$("g.node").on("click", function () {
			d3.select(this).each(function (d) {
				var somerouter = new Backbone.Router({});
				somerouter.navigate('projects/' + d.get("slug"), {trigger:true});
			});
		});
		
		callback();
		
	},
	
	// !force fn's
	tick: function(e) {
		var cmp = this;
		cmp.node.each(cmp.gravity(e.alpha * 0.7))
			 .each(cmp.collide(0.5))
			 .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
			 ;
			 
		if ( $("g.leaders").length != 0 ) {
		
			if (app.maptype == "date") {
				cmp.leader
					.attr("x2", function(d) { return d.x; } )
					.attr("y2", function(d) { return d.y; } )
					;

			}
			
			else if (app.maptype == "materials") {
				var relevantmaterials = [];
				Cartofolio.elders.models.forEach(function(d, i) {
					_(cmp.matlist).each(function (matcluster) {
						_(matcluster.materials).each(function (matObj) {
							_(d.get("materials")).each(function (nodeMat) {
								if (nodeMat == matObj.name) relevantmaterials.push({"obj": matObj, "parentproject" : d.get("slug") } );
							});
						});
					});
				});
				
				
				relevantmaterials.forEach(function (el, ix) {
				
					_(Cartofolio.elders.models).map(function ( ell ) {
						if (ell.get("slug") == el.parentproject) {
							d3.selectAll("line." + el.parentproject)
									.attr("x2", ell.x)
									.attr("y2", ell.y)
						}
					});
				
					
				});
			}
			else if (app.maptype == "techniques") {
				var relevanttechniques = [];
				Cartofolio.elders.models.forEach(function(d, i) {
					_(cmp.techlist).each(function (techcluster) {
						_(techcluster.techniques).each(function (techObj) {
							_(d.get("techniques")).each(function (nodeTech) {
								if (nodeTech == techObj.name) relevanttechniques.push({"obj": techObj, "parentproject" : d.get("slug") } );
							});
						});
					});
				});
				
				
				relevanttechniques.forEach(function (el, ix) {
				
					_(Cartofolio.elders.models).map(function ( ell ) {
						if (ell.get("slug") == el.parentproject) {
							d3.selectAll("line." + el.parentproject)
									.attr("x2", ell.x)
									.attr("y2", ell.y)
						}
					});
				
					
				});
			}
		    
	    }
	},

	gravity: function(k) {
	 return function(d) {
		 d.x += (d.x0 - d.x) * k;
		 d.y += (d.y0 - d.y) * k;
	 };
	},

	collide: function(k) {
		var cmp = this;
		var q = d3.geom.quadtree(Cartofolio.elders.models);
		 return function(node) {
			 var nr = node.r + cmp.padding,
				  nx1 = node.x - nr,
				  nx2 = node.x + nr,
				  ny1 = node.y - nr,
				  ny2 = node.y + nr;
			 q.visit(function(quad, x1, y1, x2, y2) {
			 if (quad.point && (quad.point !== node)) {
				  var x = node.x - quad.point.x,
				   y = node.y - quad.point.y,
				   l = x * x + y * y,
				   r = nr + quad.point.r;
				  if (l < r * r) {
				 l = ((l = Math.sqrt(l)) - r) / l * k;
				 node.x -= x *= l;
				 node.y -= y *= l;
				 quad.point.x += x;
				 quad.point.y += y;
				  }
			 }
			 return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
			 });
		 };
	},

	// !arrange fn's

	arrange: function (e) {
		var cmp = this;
		var kind = '';
		
		if (typeof e !== "undefined") {
			if (typeof $(e.target).parent().attr("id") !== 'undefined') { kind = $(e.target).parent().attr("id"); }
			else kind = e;
		}
		else kind = e;
		
		app.maptype = kind;
		console.log("arranging by " + kind);
		
		var resize = false;
		
		cmp.w = cmp.prevW;
		cmp.h = cmp.prevH;
		if (cmp.w >= cmp.h) {
			cmp.buffer = cmp.h/5;
		}
		else {
			cmp.buffer = cmp.w/5;
		}
		cmp.pxmin = cmp.buffer;
		cmp.pxmax = (cmp.w-cmp.buffer-cmp.sidebar);
		cmp.pymax = cmp.h-cmp.buffer;
		cmp.pymin = cmp.buffer;
		
		if ($(window).width() != cmp.prevW) {
			resize = true;
			cmp.prevW = $(window).width();
		}
		if ($(window).height() != cmp.prevH) {
			resize = true;
			cmp.prevH = $(window).height();
		}
		if ( $(window).width() != cmp.prevW && $(window).height() != cmp.prevH ) resize = false;
		
		
		
		cmp.setbuffer();
		
		cmp.xscale = d3.scale.linear()
						.domain([cmp.pxmin, cmp.pxmax])
						.range ([cmp.xmin ,  cmp.xmax]);
		cmp.yscale = d3.scale.linear()
						.domain([cmp.pymin, cmp.pymax])
						.range ([cmp.ymin ,  cmp.ymax]);
		
		if (resize) { // for resizing the map
			$("table.carto").css({
				"height": $(window).height()-$(".sidetop").height()
			});
			
			$("table.carto").css({
				"visibility": "visible",
				"display": "none"
			});
			
			$("table.carto").fadeIn(300, "easeInOutQuad");
			
			d3.selectAll("g.node").selectAll("circle")
					.attr("r",cmp.r);
			
			d3.selectAll("g.node").selectAll("image")
					.attr("transform","scale(" + cmp.s + ")");
			
			Cartofolio.elders.models.forEach(function(d) {
				d.x0 = cmp.xscale(d.x0);
				d.y0 = cmp.yscale(d.y0);
			});
		}
		
/* 		!:::: random :::: */
		if (kind == "random") {
			Cartofolio.elders.models.forEach(function(d, i) {
				d.x0 = Math.random()*(cmp.xmax-cmp.xmin) + cmp.xmin+1;
				d.y0 = Math.random()*(cmp.ymax-cmp.ymin) + cmp.ymin+1;
				d.r = cmp.r;
			});
		}
		
/* 		!:::: active :::: */
		else if (kind == "active") {
			Cartofolio.elders.models.forEach(function(d, i) {				
				if (d.get("is_active")) {
					d.y0 = cmp.ymin;
				}
				else d.y0 = cmp.ymax;
				d.r = cmp.r;
			});
		}
		
/* 		!:::: date :::: */
		else if (kind == "date") {
			var format = d3.time.format("%Y-%m-%d %H:%M:%S");
			cmp.formatDate = function(d) { return format.parse( d ); }
			
			var dates = _(Cartofolio.elders.models).map(function (d) { return cmp.formatDate(d.get("date")) });
			var hours = _(Cartofolio.elders.models).map(function (d) { return d.get("hours")});
			
			cmp.xdate = d3.time.scale()
			        .domain(d3.extent(dates))
			        .nice(d3.time.year)
			        .range([cmp.xmin, cmp.xmax]);
			
			cmp.ydate = d3.scale.linear()
					.domain(d3.extent(hours))
					.range([cmp.ymax, cmp.ymin])
					.nice();
			
			Cartofolio.elders.models.forEach(function(d, i) {
				d.x0 = cmp.xdate(dates[i]);
				d.y0 = cmp.ydate(hours[i]);
			});
			
			
			
		}

/* 		!:::: materials :::: */
		else if (kind == "materials") {
			// get list of every item
			var allmaterials = _(Cartofolio.elders.models).map(function (d) {
				return d.get("materials");
			});
			
			allmaterials = _.uniq(_(allmaterials).flatten());
			
			var total = allmaterials.length; // total number
			var portion = Math.floor(total/4); // portion for each side
			var leftover = (total%4); // leftover items
			
			// mondo array
			cmp.matlist = [
				{"position": "top", 	"charlength": 0, "materials": []},
				{"position": "right", 	"charlength": 0, "materials": []},
				{"position": "bottom", 	"charlength": 0, "materials": []},
				{"position": "left", 	"charlength": 0, "materials": []},
				{"position": "extra", 	"charlength": 0, "materials": []}
			];
			
			var extras = []; // intermediary, to store extras 
			
			// distribute items to portions
			_(allmaterials).each(function (d,i) {
				if (i < portion) 						cmp.matlist[0].materials.push({"name" : d, "xpos" : 0, "ypos" : 0});
				if (i >= portion && i < portion*2) 		cmp.matlist[1].materials.push({"name" : d, "xpos" : 0, "ypos" : 0});
				if (i >= portion*2 && i < portion*3) 	cmp.matlist[2].materials.push({"name" : d, "xpos" : 0, "ypos" : 0});
				if (i >= portion*3 && i < portion*4) 	cmp.matlist[3].materials.push({"name" : d, "xpos" : 0, "ypos" : 0});
				if (i >= portion*4) 					cmp.matlist[4].materials.push({"name" : d, "xpos" : 0, "ypos" : 0});
			});
			
			// count letters in mondo list + extra
			_(cmp.matlist).each(function (d) {
				_(d.materials).each(function (mat){
					d.charlength += mat.name.replace(/[^ A-Z]/gi, "").length;
				});
				
				if (d.position == "extra") {
					_(d.materials).each(function (mat){
						extras.push({
							"name": mat,
							"charlength": mat.name.replace(/[^ A-Z]/gi, "").length
							});
					});
				}
			});


			//sort mondo list + extras by character count
			cmp.matlist = _(cmp.matlist).sortBy(function (d) { return d.charlength; });
			extras = _(extras).sortBy(function (d) { return d.charlength*-1; });
			
			//dish out extras to portions
			_(extras).each(function (d, i) {
				cmp.matlist[i%4].materials.push(d.name);
			});
			
			// remove "extra" portion (which is now useless) from mondo list
			cmp.matlist.forEach(function ( d, i ) {
				if (d.position == "extra") cmp.matlist.splice(i, 1);
			});
			
			// assign x + y positions to each item + count characters (just in case it's needed later - currently unused)
			_(cmp.matlist).each(function (d) {
				d.charlength = 0;
				_(d.materials).each(function (mat, i){
					d.charlength += mat.name.replace(/[^ A-Z]/gi, "").length;
					
					switch(d.position) {
						case "top":
							mat.xpos = (cmp.xmax-cmp.xmin)/d.materials.length*(i+0.5) + cmp.xmin;
							mat.ypos = cmp.ymin;
							break;
							
						case "bottom":
							mat.xpos = (cmp.xmax-cmp.xmin)/d.materials.length*(i+0.5) + cmp.xmin;
							mat.ypos = cmp.ymax;
							break;
							
						case "left":
							mat.xpos = cmp.xmin;
							mat.ypos = (cmp.ymax-cmp.ymin)/d.materials.length*(i+0.5) + cmp.ymin;
							break;
							
						case "right":
							mat.xpos = cmp.xmax;
							mat.ypos = (cmp.ymax-cmp.ymin)/d.materials.length*(i+0.5) + cmp.ymin;
							break;
					}
				});
			});
			
			// for each project, make a list of the items it should care about
			Cartofolio.elders.models.forEach(function(d, i) {
				var relevantmaterials = [];
				_(cmp.matlist).each(function (matcluster) {
					_(matcluster.materials).each(function (matObj) {
						_(d.get("materials")).each(function (nodeMat) {
							if (nodeMat == matObj.name) relevantmaterials.push(matObj);
						});
					});
				});
				
				// calculate average x and y positions:
				var xtot = 0;
				_(relevantmaterials).each(function ( r ) {
					xtot += r.xpos;
				});
				var ytot = 0;
				_(relevantmaterials).each(function ( r ) {
					ytot += r.ypos;
				});
				
				d.x0 = xtot / relevantmaterials.length;
				d.y0 = ytot / relevantmaterials.length;
			});
			
			
		}

/* 		!:::: techniques :::: */
		else if (kind == "techniques") {
			// get list of every item
			var alltech = _(Cartofolio.elders.models).map(function (d) {
				return d.get("techniques");
			});
			
			alltech = _.uniq(_(alltech).flatten());
			
			var total = alltech.length; // total number
			var portion = Math.floor(total/4); // portion for each side
			var leftover = (total%4); // leftover items
			
			// mondo array
			cmp.techlist = [
				{"position": "top", 	"charlength": 0, "techniques": []},
				{"position": "right", 	"charlength": 0, "techniques": []},
				{"position": "bottom", 	"charlength": 0, "techniques": []},
				{"position": "left", 	"charlength": 0, "techniques": []},
				{"position": "extra", 	"charlength": 0, "techniques": []}
			];
			
			var extras = []; // intermediary, to store extras 
			
			// distribute items to portions
			_(alltech).each(function (d,i) {
				if (i < portion) 						cmp.techlist[0].techniques.push({"name" : d, "xpos" : 0, "ypos" : 0});
				if (i >= portion && i < portion*2) 		cmp.techlist[1].techniques.push({"name" : d, "xpos" : 0, "ypos" : 0});
				if (i >= portion*2 && i < portion*3) 	cmp.techlist[2].techniques.push({"name" : d, "xpos" : 0, "ypos" : 0});
				if (i >= portion*3 && i < portion*4) 	cmp.techlist[3].techniques.push({"name" : d, "xpos" : 0, "ypos" : 0});
				if (i >= portion*4) 					cmp.techlist[4].techniques.push({"name" : d, "xpos" : 0, "ypos" : 0});
			});
			
			// count letters in mondo list + extra
			_(cmp.techlist).each(function (d) {
				_(d.techniques).each(function (tech){
					d.charlength += tech.name.replace(/[^ A-Z]/gi, "").length;
				});
				
				if (d.position == "extra") {
					_(d.techniques).each(function (tech){
						extras.push({
							"name": tech,
							"charlength": tech.name.replace(/[^ A-Z]/gi, "").length
							});
					});
				}
			});


			//sort mondo list + extras by character count
			cmp.techlist = _(cmp.techlist).sortBy(function (d) { return d.charlength; });
			extras = _(extras).sortBy(function (d) { return d.charlength*-1; });
			
			//dish out extras to portions
			_(extras).each(function (d, i) {
				cmp.techlist[i%4].techniques.push(d.name);
			});
			
			// remove "extra" portion (which is now useless) from mondo list
			cmp.techlist.forEach(function ( d, i ) {
				if (d.position == "extra") cmp.techlist.splice(i, 1);
			});
			
			// assign x + y positions to each item + count characters (just in case it's needed later - currently unused)
			_(cmp.techlist).each(function (d) {
				d.charlength = 0;
				_(d.techniques).each(function (tech, i){
					d.charlength += tech.name.replace(/[^ A-Z]/gi, "").length;
					
					switch(d.position) {
						case "top":
							tech.xpos = (cmp.xmax-cmp.xmin)/d.techniques.length*(i+0.5) + cmp.xmin;
							tech.ypos = cmp.ymin;
							break;
							
						case "bottom":
							tech.xpos = (cmp.xmax-cmp.xmin)/d.techniques.length*(i+0.5) + cmp.xmin;
							tech.ypos = cmp.ymax;
							break;
							
						case "left":
							tech.xpos = cmp.xmin;
							tech.ypos = (cmp.ymax-cmp.ymin)/d.techniques.length*(i+0.5) + cmp.ymin;
							break;
							
						case "right":
							tech.xpos = cmp.xmax;
							tech.ypos = (cmp.ymax-cmp.ymin)/d.techniques.length*(i+0.5) + cmp.ymin;
							break;
					}
				});
			});
			
			// for each project, make a list of the items it should care about
			Cartofolio.elders.models.forEach(function(d, i) {
				var relevanttechniques = [];
				_(cmp.techlist).each(function (techcluster) {
					_(techcluster.techniques).each(function (techObj) {
						_(d.get("techniques")).each(function (nodeTech) {
							if (nodeTech == techObj.name) relevanttechniques.push(techObj);
						});
					});
				});
				
				// calculate average x and y positions:
				var xtot = 0;
				_(relevanttechniques).each(function ( r ) {
					xtot += r.xpos;
				});
				var ytot = 0;
				_(relevanttechniques).each(function ( r ) {
					ytot += r.ypos;
				});
				
				d.x0 = xtot / relevanttechniques.length;
				d.y0 = ytot / relevanttechniques.length;
			});
		}

/* 		!:::: dimensions :::: */
		else if (kind == "dimensions") {
			
			Cartofolio.elders.models.forEach(function (d, i) {
				// if dimensions include a +, it's temporal
				var temporal = d.get("dimensions").toString().search("[\+]") != -1;
				// strip out just the non-time dimensions
				var dims = d.get("dimensions").toString().replace(new RegExp("[\+]."), "");
				
				// temporal = up
				if (temporal) d.y0 = cmp.ymin;
				else d.y0 = cmp.ymax;
				
				// split into 3 dimensions
				d.x0 = (cmp.xmax - cmp.xmin)/2 * (dims-1) + cmp.xmin;
				
/* 				console.log(d.get("title") + ": " + d.get("dimensions") + " temporal = " + temporal + " dims = " + dims); */
			});
		}

/* 		!:::: scale :::: */
		else if (kind == "scale") {
			var maxproj = _.max(Cartofolio.elders.models, function (m) {
					return m.get("scale");
				});
			var minproj = _.min(Cartofolio.elders.models, function (m) {
					return m.get("scale");
				});
			
			
			
			cmp.scalex = d3.scale.linear()
							.domain([minproj.get("scale"), maxproj.get("scale")])
							.rangeRound([cmp.xmin, cmp.xmax]);
			
			Cartofolio.elders.models.forEach(function (d, i) {
				d.x0 = cmp.scalex(d.get("scale"));
				d.y0 = (cmp.ymax-cmp.ymin)/2 + cmp.ymin;
			});
			
		}

/* 		!:::: reasons :::: */
		else if (kind == "reasons") {}
		
		cmp.drawaxes(kind);
		cmp.drawleaders(kind);
		cmp.force.resume();
	},
	
	drawaxes: function (kind) {
		var cmp = this;
		
		var axes;
		
		if ($(".axes").length) $(".axes").fadeOut(300, "easeInOutQuad", function () {
			this.remove();
			axisappend();			
		});
		
		else axisappend();
		
		function axisappend() {
			if (kind != "random") {
				axes = cmp.parchment.append("g")
					.attr("class","axes")
					;
			}
			
			if (kind == "date") {
				    
				var xAxis = d3.svg.axis().scale(cmp.xdate).orient("bottom");
				var yAxis = d3.svg.axis().scale(cmp.ydate).orient("left").ticks(3).tickFormat(function (d, i) {
					if (i==0) return "a few";
					else return d;
				});
				
				var axes = d3.select("g.axes");
				
				if ( $("g.x-axis").length == 0 ) {
					axes.append("g")
							.attr("class", "x-axis")
							.attr("transform", "translate(0," + (cmp.ymax+cmp.r*2) + ")")
							.call(xAxis)
							;
					axes.append("text")
						    .attr("class", "axislabel x-label")
						    .attr("text-anchor", "middle")
						    .attr("transform", "translate(" + ((cmp.xmax-cmp.xmin)/2 + cmp.xmin) + "," + (cmp.ymax + cmp.buffer*3/4) + ")")
						    .text("when it got finished");
				}
			
				if ( $("g.y-axis").length == 0 ) {
					axes.append("g")
							.attr("class", "y-axis")
							.attr("transform", "translate(" + (cmp.buffer) + ",0)")
							.call(yAxis)			
							;
					axes.append("text")
						    .attr("class", "axislabel y-label")
						    .attr("text-anchor", "middle")
						    .attr("transform", "translate(" + (cmp.buffer/2) + "," + ((cmp.ymax-cmp.ymin)/2 + cmp.ymin) + "), rotate(-90)")
						    .text("hours i spent working on it");
				}
			}
			
			else if (kind == "active") {
				axes.append("text")
					.attr("class", "axislabel")
					.attr("x", (cmp.xmax-cmp.xmin)/2+cmp.xmin)
					.attr("y", cmp.ymin-cmp.buffer/2)
					.attr("dy", "0")
					.text("ongoing")
					;
				axes.append("text")
					.attr("class", "axislabel")
					.attr("x", (cmp.xmax-cmp.xmin)/2+cmp.xmin)
					.attr("y", cmp.ymax+cmp.buffer/2)
					.attr("dy", "1em")
					.text("completed")
					;
					
				axes.append("line")
					.attr("x1",cmp.xmin)
					.attr("x2",cmp.xmax)
					.attr("y1",(cmp.ymax-cmp.ymin)/2+cmp.ymin)
					.attr("y2",(cmp.ymax-cmp.ymin)/2+cmp.ymin)
					;
			}
			
			else if (kind == "materials") {
				_(cmp.matlist).each(function(d) {
					_(d.materials).each(function (mat, i){
					var thetext = axes.append("text")
									.attr("class", "axislabel")
									.attr("x", mat.xpos)
									.attr("y", mat.ypos)
									.text(mat.name);
									
					switch(d.position) {
						case "top":
							thetext.attr("dy", -cmp.r - 10);
							break;
						case "bottom":
							thetext.attr("dy", cmp.r + 10);
							break;
						case "left":
							thetext.attr("class", "axislabel alignright")
								.attr("dx", -cmp.r - 10);
							break;
						case "right":
							thetext.attr("class", "axislabel alignleft")
								.attr("dx", cmp.r + 10);
							break;
					}
					
					});
				});
			}
			
			else if (kind == "techniques") {
				_(cmp.techlist).each(function(d) {
					_(d.techniques).each(function (tech, i){
					var thetext = axes.append("text")
									.attr("class", "axislabel")
									.attr("x", tech.xpos)
									.attr("y", tech.ypos)
									.text(tech.name);
									
					switch(d.position) {
						case "top":
							thetext.attr("dy", -cmp.r - 10);
							break;
						case "bottom":
							thetext.attr("dy", cmp.r + 10);
							break;
						case "left":
							thetext.attr("class", "axislabel alignright")
								.attr("dx", -cmp.r - 10);
							break;
						case "right":
							thetext.attr("class", "axislabel alignleft")
								.attr("dx", cmp.r + 10);
							break;
					}
					
					});
				});
			}
			
			else if (kind == "dimensions") {
				axes.append("text")
					.attr("class", "axislabel")
					.attr("x", (cmp.xmax-cmp.xmin)/2+cmp.xmin)
					.attr("y", cmp.ymin-cmp.buffer/2)
					.attr("dy", "0")
					.text("temporal")
					;
				axes.append("text")
					.attr("class", "axislabel")
					.attr("x", (cmp.xmax-cmp.xmin)/2+cmp.xmin)
					.attr("y", cmp.ymax+cmp.buffer/2)
					.attr("dy", "1em")
					.text("atemporal")
					;
					
				for (var i = 0; i < 3; i++) {
					axes.append("text")
						.attr("class","axislabel")
						.attr("x", (cmp.xmax-cmp.xmin)/2*i+cmp.xmin)
						.attr("y", (cmp.ymax-cmp.ymin)/2 + cmp.ymin)
						.attr("dy", "1em")
						.text(i+1)
						;
				}
				
				for (var i = 0; i <= 1; i++) {
					axes.append("line")
						.attr("x1",(cmp.xmax-cmp.xmin)/2*i+cmp.xmin+((cmp.xmax-cmp.xmin)/4))
						.attr("x2",(cmp.xmax-cmp.xmin)/2*i+cmp.xmin+((cmp.xmax-cmp.xmin)/4))
						.attr("y1",cmp.ymin)
						.attr("y2",cmp.ymax)
						;
				}
				
			}
			
			else if (kind == "scale") {
				var scalexaxis = d3.svg.axis().scale(cmp.scalex).orient("bottom");
				
				var axes = d3.select("g.axes");
				
				if ( $("g.x-axis").length == 0 ) {
					axes.append("g")
							.attr("class", "x-axis")
							.attr("transform", "translate(0," + (cmp.ymax+cmp.r*2) + ")")
							.call(scalexaxis)
							;
					axes.append("text")
						    .attr("class", "axislabel x-label")
						    .attr("text-anchor", "middle")
						    .attr("transform", "translate(" + ((cmp.xmax-cmp.xmin)/2 + cmp.xmin) + "," + (cmp.ymax + cmp.buffer*3/4) + ")")
						    .text("cubic feet");
				}
				
			}
			
			$(".axes").fadeIn(300, "easeInOutQuad");
		}
		
		
	},
	
	drawleaders: function(kind) {
		var cmp = this;
		if ( $("g.leaders").length != 0 ) {
			$("g.leaders").fadeOut(600, "easeInOutQuad", function () {
				this.remove();
				leaderappend();
			});
		}
		else leaderappend();
		
		function leaderappend() {			
			
			if (kind == "date") {
				if ( $("g.leaders").length == 0 ) {
					cmp.leader = cmp.parchment.insert("g", ":first-child")
							.attr("class", "leaders")
							.selectAll("line")
						.data(Cartofolio.elders.models)
					.enter().append("line")
							.attr("z-index", -5)
							.attr("class", function (d) { return "leader " + d.get("slug"); })
							.attr("x1", function(d) { return cmp.xdate(cmp.formatDate(d.get("date"))); } )
							.attr("y1", cmp.ymax+cmp.r*2 )
							.attr("x2", function(d) { return d.x ; } )
							.attr("y2", function (d) { return d.y; } )
							.call(cmp.force.drag);
					}
					
					$("g.leaders").fadeIn(600, "easeInOutQuad");
			}
			
			else if (kind == "materials") {
				var relevantmaterials = [];
				Cartofolio.elders.models.forEach(function(d, i) {
					_(cmp.matlist).each(function (matcluster) {
						_(matcluster.materials).each(function (matObj) {
							_(d.get("materials")).each(function (nodeMat) {
								if (nodeMat == matObj.name) relevantmaterials.push({"obj": matObj, "parentproject" : d.get("slug") } );
							});
						});
					});
				});
				
				if ( $("g.leaders").length == 0 ) {
					cmp.matleader = cmp.parchment.insert("g", ":first-child")
								.attr("class", "leaders");
								
					relevantmaterials.forEach(function (el, ix) {
					
						_(Cartofolio.elders.models).map(function ( ell ) {
							if (ell.get("slug") == el.parentproject) {
								cmp.matleader.append("line")
										.attr("z-index", -5)
										.attr("class", "leader " + el.parentproject + " " + el.obj.name)
										.attr("x1", el.obj.xpos)
										.attr("y1", el.obj.ypos)
										.attr("x2", ell.x)
										.attr("y2", ell.y)
										.call(cmp.force.drag);
							}
						});
					
						
					});
				}
					
				$("g.leaders").fadeIn(600, "easeInOutQuad");
			}
			else if (kind == "techniques") {
				var relevanttechniques = [];
				Cartofolio.elders.models.forEach(function(d, i) {
					_(cmp.techlist).each(function (techcluster) {
						_(techcluster.techniques).each(function (techObj) {
							_(d.get("techniques")).each(function (nodeTech) {
								if (nodeTech == techObj.name) relevanttechniques.push({"obj": techObj, "parentproject" : d.get("slug") } );
							});
						});
					});
				});
				
				if ( $("g.leaders").length == 0 ) {
					cmp.techleader = cmp.parchment.insert("g", ":first-child")
								.attr("class", "leaders");
								
					relevanttechniques.forEach(function (el, ix) {
					
						_(Cartofolio.elders.models).map(function ( ell ) {
							if (ell.get("slug") == el.parentproject) {
								cmp.techleader.append("line")
										.attr("z-index", -5)
										.attr("class", "leader " + el.parentproject + " " + el.obj.name)
										.attr("x1", el.obj.xpos)
										.attr("y1", el.obj.ypos)
										.attr("x2", ell.x)
										.attr("y2", ell.y)
										.call(cmp.force.drag);
							}
						});
					
						
					});
				}
					
				$("g.leaders").fadeIn(600, "easeInOutQuad");
			}
		}
	},
		
	resize: function () {
		var cmp = this;
		console.log("resized!");
		cmp.arrange(app.maptype);
	},


	setbuffer: function() {
		var cmp = this;

		cmp.w = $(window).width();
		cmp.h = $(window).height();

		if (cmp.w >= cmp.h) {
			cmp.buffer = cmp.h/5;
			cmp.r = Math.round(cmp.buffer/7);
		}
		else {
			cmp.buffer = cmp.w/5;
			cmp.r = Math.round(cmp.buffer/7);
		}


		cmp.s = 2*cmp.r/150;
		cmp.xmin = cmp.buffer*1.5;
		cmp.xmax = (cmp.w-cmp.buffer*1.5-cmp.sidebar);
		cmp.ymax = cmp.h-cmp.buffer;
		cmp.ymin = cmp.buffer;
		
		d3.select("rect.boundingbox")
			.attr("x",cmp.xmin)
			.attr("y",cmp.ymin)
			.attr("width", cmp.xmax-cmp.xmin)
			.attr("height",cmp.ymax-cmp.ymin)
			;
	},
	
	

	});


/* !==== SINGLE VIEW ==== */

  Cartofolio.Views.Single = Backbone.Layout.extend({

	template: "single",
	className: "single",

	initialize: function (model) {

	var lay = this;

	},

	afterRender: function () {
		$(".container").hide();

		var lay = this;
		var model = this.model;

		var pieces = [
			app.fixDate(model),
			"took " + model.get("hours") + " hours of work",
			"made with " + app.fixList(model, "materials"),
			"used " + app.fixList(model, "techniques"),
			"occupies " + model.get("dimensions") + " dimensions",
			"takes up " + app.fixScale(model),
		];

		var wrapped = _(pieces).map(function (thing) {
			return "<tr><td>" + thing + "</td></tr>";
		});

		wrapped.unshift("<tr><th>" + model.get("title") + "</th></tr>");

		lay.$el.append([
			'<div class="sidebar"></div>',
			'<div class="mainstage"></div>',
			'<img class="little_thumb" src="' + model.get("thumbnail") + '"></img>'
		]);

		$(".sidebar").append("<table class='sidetable' cellspacing='0' cellpadding='0'></table>");

		$("table.sidetable").append(wrapped);

		$(".mainstage").append([
			'<img class="content_thumb" src="' + model.get("thumbnail") + '"></img>',
			'<div class="maincontent">' + model.get("content") + '</div>'
		]);

		// !---- GALLERY ----

		$(".mainstage").append("<div class='gallery'></div>");

		var attachments = _(model.get("attachments")).filter(function (attachment) {
			return attachment.slug.search("icon") == -1;
		});

		images = _(attachments).map(function (attch) {
			return "<div class='gthumb' id='"
			+ attch.slug
			+ "' style='background: url("
			+ attch.images.thumbnail.url
			+ ")no-repeat center center'><div class='gfill'></div></div>";
		})

		$(".gallery").append(images);

		/* !---- mouse behavior stuff ---- */
		$(".gfill").mouseenter(function () {
			$(this).animate({"background-color": "rgba(0,0,0,0.7)"}, 100, "easeInQuad");
		});
		$(".gfill").mouseleave(function () {
			$(this).animate({"background-color": "rgba(0,0,0,0.0)"}, 300, "easeInQuad");
		});

		_(attachments).each(function ( attch ) {
			$("#" + attch.slug).click(function () {
				var route = 'projects/' + model.get("slug") + '/images/' + attch.slug;
				console.log(route);
				var somerouter = new Backbone.Router({});
				somerouter.navigate(route, {trigger:true});
			});
		})





		if (model.get("children").length) {
			var children = _(model.get("children")).map(function (child) {
				return "<div class='maincontent child'><h1>" + child.title + "</h1>" + child.content + "</div>";
			});

			$(".mainstage").append(children);
		}

		this.sizefix();
	},

	sizefix: function () {
		if ($(".container").children().length) {
			$(".container").fadeOut(600, "easeInOutQuad", function () {
				dothebusiness();
				$(".container").fadeIn(600, "easeInOutQuad", function () {
					app.greenlight.trigger("green");
				});
			})
		}
		else {
			dothebusiness();
			$(".container").fadeIn(600, "easeInOutQuad", function () {
				app.greenlight.trigger("green");
			});
		}


		function dothebusiness() {
			$(".container").css({
				"visibility": "hidden",
				"display": "block"
			});
			if ( app.shouldBeSkinny ) {

				$(".sidebar, .sidebar th, .sidebar td, .mainstage").addClass("skinny");

				$(".content_thumb").hide();
				$(".little_thumb").show();

				$(".sidebar.skinny").css("width", $(".container").width()-$(".little_thumb").outerWidth()-50);
				$(".mainstage.skinny").css("top", $(".sidebar.skinny").outerHeight() + "px");
			}
			else {
				$(".sidebar, .sidebar th, .sidebar td, .mainstage").removeClass("skinny");

				if ($(".container").width()/4 < 300) $(".sidebar").css("width", "300px");
		  		else if ($(".container").width()/4 >= 300) $(".sidebar").css("width", $(".container").width()/4 + "px");

		  		$(".little_thumb").hide();
				$(".content_thumb").show();

				$(".sidebar").css("height", $(window).height()-$(".header").outerHeight());
				var available = $(".sidebar").height();
				$(".sidebar th").css("height", available/($(".sidebar td").length + 1)-20 + "px");
				$(".sidebar td").css("height", available/($(".sidebar td").length + 1) + "px");

				$(".mainstage").css({
					"left": $(".sidebar").outerWidth() + "px",
					"width": widthcalc( "big" )
				});
			}

			$(".container").css({
				"visibility": "visible",
				"display": "none"
			});
			/* utility function, for keeping text readable */
			function widthcalc( size ) {
  			if (app.shouldBeSkinny) {
	  			return $(".container").width();
  			}

  			else {
	  			var msw = $(".container").width()-$(".sidebar").outerWidth();
				var newwidth;
				if (msw > 900) newwidth = 900;
				else if (msw <= 900 && msw > 400) newwidth = msw;
				else if (msw <= 400) newwidth = 400;
				return newwidth;
  			}
  		}
		}

	}


  }); // end single view

/*   !==== PHOTO BOX VIEW ==== */

  Cartofolio.Views.Photobox = Backbone.Layout.extend({
  	  className: "photobox",
  	  template: "gallery",

  	  images: {},

  	  primage: "",
  	  crimage: "",
  	  nximage: "",
  	  height: $(window).height() - 50,
  	  firstRender: true,

	  initialize: function () {
	  	var cmp = this;

	  	if ($(".header").outerHeight() != 0) cmp.height = $(window).height() - $(".header").outerHeight();

	  	cmp.images = _(cmp.model.get("attachments")).filter(function (attachment) {
			return attachment.slug.search("icon") == -1;
		});

 	  	console.log("--- photobox initialized with model " + cmp.model.get("title") + " and image " + cmp.crimage.title + " ---");

 	  	$(document).keydown(function(e) {
		    if (e.keyCode == 27) {
		        cmp.destroy();
		    }
		});
	  },

	  afterRender: function () {
	  	var cmp = this;

		cmp.lineup(cmp.options.image);
		cmp.turnon();

		$("#caption").text(cmp.crimage.title);

		$(cmp.$el).css({
			"display": "none",
			"visibility": "visible"
		});

		$("td.cg").on("click", function () {cmp.destroy()});

	  	$("td.prev, td.next, td.prevs, td.nexts").on("click", function (e) {
	  		console.log(e.currentTarget.className);
	  		cmp.turnoff();
	  		cmp.turnon();
		  	if (e.currentTarget.className == "next" || e.currentTarget.className == "nexts") {
		  		if (typeof cmp.nximage !== "undefined") cmp.lineup(cmp.nximage.slug);
		  	}
		    else if (e.currentTarget.className == "prev" || e.currentTarget.className == "prevs") {
			    if (typeof cmp.primage !== "undefined") cmp.lineup(cmp.primage.slug);
		    }
	  	});
		$(".photobox").fadeIn(200, "easeInOutQuad", function () {
			cmp.sizefix();
		});  	
		
	  	

	  },

	  destroy: function () {
	  	var cmp = this;
		console.log("self destructing");
		var nr = new Backbone.Router({});
		nr.navigate("projects/" + cmp.model.get("slug"), {trigger: true});
		$(".photobox").fadeOut(500, "easeInOutQuad", function () {
			cmp.remove();
		});
		$(".closegallery").fadeOut(300).remove();
		cmp.firstRender = true;
	  },

	  lineup: function (desiredCurrent) {
	  	 var cmp = this;
		 _(cmp.images).each(function (image, i) {
		  	if (image.slug == desiredCurrent) {
		  		cmp.primage = cmp.images[i-1];
		  		cmp.crimage = image;
		  		cmp.nximage = cmp.images[i+1];
		  	}
		  	$("#caption").text(cmp.crimage.title);
		  	var nr = new Backbone.Router({});
			nr.navigate("projects/" + cmp.model.get("slug") + "/images/" + cmp.crimage.slug);
	  	});

	  	($("img.currimg").length) ?
	  		$("img.currimg").attr("src", cmp.crimage.images.large.url)
		  	: $("td.currimg").append("<img class='currimg' src='" + cmp.crimage.images.large.url + "' height=" + cmp.height + "></img>");

		if (typeof cmp.primage !== "undefined") {
			$("td.previmg").css("background", "url('" + cmp.primage.images.large.url + "') no-repeat center center");
			$("td.prev").css("cursor", "pointer");
			$("td.prev p").text(cmp.primage.title);
			$("td.prevs").text("prev");
		}
		else {
			$("td.prev").css("cursor", "");
			$("td.previmg").css("background-image", "");
			$("td.prev p").text("").css("background", "");
			$("td.prevs").text("");
		}
		if (typeof cmp.nximage !== "undefined") {
			$("td.nextimg").css("background", "url('" + cmp.nximage.images.large.url + "') no-repeat center center");
			$("td.next").css("cursor", "pointer");
			$("td.next p").text(cmp.nximage.title);
			$("td.nexts").text("next");
		}
		else {
			$("td.next").css("cursor", "");
			$("td.nextimg").css("background-image", "");
			$("td.next p").text("").css("background", "");
			$("td.nexts").text("");
		}
		
		
		$("tr.text td").css("height", cmp.height);
		$("td.previmg, td.nextimg, td.prev, td.next").css({
			"width": ($(window).width()-$("img.currimg").width())/2
		});
		$("td.curr, td.curr p").css({
			"width": $("td.currimg").width()
		});

		$("td.curr p").wrap("<a data-bypass href='" + cmp.crimage.url + "' target='_blank'></a>")
	  },

	  turnoff: function () {
		  $.fx.off = true;
		  $("td.prev").off("mouseenter mouseleave");
	  },

	  turnon: _.debounce(function () {
		  $.fx.off = false;

		  $("td.prev, td.next").on('mouseenter', function (e) {
				if ($("." + e.currentTarget.className + " p").text() != "") {
					$("." + e.currentTarget.className + "img").animate({"opacity": 0.3}, 200, "easeInOutQuad");
					$("." + e.currentTarget.className + " p").animate({"background-color": "rgba(255,255,255,0.4)"}, 200, "easeInOutQuad");
				}
		  });
		  $("td.prev, td.next").on('mouseleave', function (e) {
				if ($("." + e.currentTarget.className + " p").text() != "") {
			  	$("." + e.currentTarget.className + "img").animate({"opacity": 0.05}, 200, "easeInOutQuad");
			  	$("." + e.currentTarget.className + " p").animate({"background-color": "rgba(255,255,255,0.0)"}, 200, "easeInOutQuad");
				}
		  });

		  $("td.previmg, td.nextimg, td.prev, td.next").css({
			  "width": ($(window).width()-$("img.currimg").width())/2
		  });
		  $("td.curr").css({
			  "width": $("td.currimg").width()
		  });
	  }, 200),

	  sizefix: function () {
	  		var cmp = this;
	  		if ($(".header").outerHeight() != 0) cmp.height = $(window).height() - $(".closegallery").outerHeight();
	  		
	  		if (app.shouldBeSkinny) {
		  		if ($("td.prev").is(":visible")) $("td.prev, td.next").fadeOut();
		  		if ($("td.previmg").is(":visible")) $("td.previmg, td.nextimg").fadeOut(function () {
		  			$("td.currimg").css({
			  			"width": $(window).width(),
			  			"text-align": "center"
			  		});
			  		$("td.curr, td.curr p").css({
						"width": $(window).width()
					});
		  		});
		  		else if (! $("td.previmg").is(":visible")) {
			  		$("td.currimg").css({
			  			"width": $(window).width(),
			  			"text-align": "center"
			  		});
			  		$("td.curr, td.curr p").css({
						"width": $(window).width()
					});
		  		}
		  		
		  		
				
				


			}
			else { // if app should be fat
				if (!$("td.prev").is(":visible")) $("td.prev, td.next").fadeIn();
				if (!$("td.previmg").is(":visible")) $("td.previmg, td.nextimg").fadeIn();
				$("td.currimg").css({
		  			"padding": ""
		  		});
				$("td.curr, td.curr p").css({
					"width": $("td.currimg").width()
				});
				
 			}
 			$("td.previmg, td.currimg, td.nextimg, td.prev, td.curr, td.next").animate({
				"height": cmp.height
			});
			
			if ($(window).width() < $("img.currimg").width()) $("img.currimg").css({
				"width": $(window).width(),
				"height": "auto"
			});
			else $("img.currimg").css({
				"height": cmp.height,
				"width": "auto"
			});
			
			$("td.previmg, td.nextimg, td.prev, td.next").animate({
			  	"width": ($(window).width()-$("img.currimg").width())/2
			});

			
			
 			
			if (cmp.firstRender) $("tr.text, .closegallery").css({
				"display" : "none",
				"visibility": "visible"
			});			

			(cmp.firstRender) ? $("tr.text, .closegallery").fadeIn("fast", function () {cmp.firstRender = false;}) : $("tr.text").show();


	  }


  }); // end photo box view

  // Return the module for AMD compliance.
  return Cartofolio;

});
