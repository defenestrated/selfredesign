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
		w: '',
		h: '',
		x: '', y: '', ux: '', uy: '', xmin: '', ymin: '', xmax: '', ymax: '', axes: '', leader: '',
		lastX: 0,
		lastY: 0,
		firstRender: true,
		sidebar: 300,
		r: 10,
		s: 0,
		maptype: "random",
		nodes: [],
		force: '',
		gravity: '',
		tick: '',
		collide: '',

		padding: 7,
		fadetime: 1000,

		bR: 30, // button radius

		format: '', // to hold date formatting

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

		sizefix: function () {},

		
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
				cmp.format = d3.time.format("%Y-%m-%d %H:%M:%S");
				cmp.setbuffer();
				
				Cartofolio.elders.on("greenlight", function () {
					console.log("done with the elders");
					console.log(_(Cartofolio.elders.models).map(function (model) {
						return model.get("title");
					}));
					cmp.d3_dom(function () {
						cmp.arrange(cmp.maptype);
					});
				});
				
				if (Cartofolio.elders.length > 1) {
					console.log(_(Cartofolio.elders.models).map(function (model) {
						return model.get("title");
					}));
					cmp.d3_dom(function () {
						cmp.arrange(cmp.maptype);
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
			 	
			 	$(".container").fadeIn(600, "easeInOutQuad");
			 	
				cmp.firstRender = false;
			}
			

		},



		d3_dom: function(callback) {
		var cmp = this;

		cmp.parchment = d3.select(".cf-wrapper").append("svg")
			.attr("class", "parchment")
			.attr("width", "100%")
			.attr("height", "100%")
			;

		// !---- buttons ----
				
		/*
var sortbuttons = cmp.parchment.append("g")
			.attr("id", "sortbuttons");

		var Bscramble = sortbuttons.append("g")
				.attr("class", "link")
				.attr("id", "random")
				;

		Bscramble.append("text") // button text
				.attr("class", "link")
				.text("scramble")
				.attr("x", cmp.w-cmp.sidebar)
				.attr("y", cmp.parchment.selectAll("text.link")[0].length*40);

		Bscramble.insert("ellipse", "text") //background circle
				.attr("class", "link")
				.attr("rx", function () { return Bscramble.select("text")[0][0].clientWidth*3/4; })
				.attr("ry", 20)
				.attr("cx", cmp.w-cmp.sidebar)
				.attr("cy", cmp.parchment.selectAll("text.link")[0].length*40)
				.attr("stroke", "black")
				.attr("stroke-width", "2pt");
*/

		Cartofolio.elders.models.forEach(function(d, i) {
			d.x = $(window).width()/2;
			d.y = $(window).height()/2;
			d.x0 = $(window).width()/2;
			d.y0 = $(window).height()/2;
			d.r = cmp.r;
		});
		
		$(".cf-wrapper").append('<div class=sidebar></div>');
		$(".sidebar").css("width", cmp.sidebar + "px");
		
		$(".sidebar").append([
			"<div class='homelogo'><a href='/'>sam galison</a></div>",
			"<ul class='cartonav'></ul>",
			"<table class='sorting'"
			]);
		
		$("ul.cartonav").append([
			"<a	href='javascript:void(0)' onclick='projectselect()'><li id='projects'>projects</li></a>",
			"<a	href='contact'>	<li id='contact'>	contact	</li></a>",
			"<a	href='resumes'>	<li id='resumes'>	resumé	</li></a>"
		]);
		
		
		
		
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
			var label = d3.select(this).append("g")
					.attr("class", "label")
					.attr("id", function (d) { return d.get("slug"); })
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
		});
		
		$("g.node").on("mouseleave", function () {
			$("g.label").fadeOut("fast", function () {
				$(this).remove();
			});
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
	test: function test() { console.log("testing"); },

	arrange: function (e) {
		var cmp = this;
		var kind = '';

		if ($(e.target).parent().attr("id") != undefined) { kind = $(e.target).parent().attr("id"); }
		else kind = e;

		console.log("arranging by " + kind);

		cmp.setbuffer();

		if (kind == "random") {
			Cartofolio.elders.models.forEach(function(d, i) {
				d.x0 = Math.random()*(cmp.xmax-cmp.xmin) + cmp.xmin+1;
				d.y0 = Math.random()*(cmp.ymax-cmp.ymin) + cmp.ymin+1;
				d.r = cmp.r;
			});
		}


		cmp.force.resume();
	},
	
	resize: function () {
		var cmp = this;
		console.log("resized!");
		cmp.arrange(cmp.maptype);
	},


	setbuffer: function() {
		var cmp = this;

		cmp.w = $(window).width();
		cmp.h = $(window).height();

		if (cmp.w >= cmp.h) {
			cmp.buffer = cmp.h/5;
			cmp.r = Math.round(cmp.buffer/6);
		}
		else {
			cmp.buffer = cmp.w/5;
			cmp.r = Math.round(cmp.buffer/6);
		}


		cmp.s = 2*cmp.r/150;
		cmp.xmin = cmp.buffer;
		cmp.xmax = (cmp.w-cmp.buffer-cmp.sidebar);
		cmp.ymax = cmp.h-cmp.buffer*1.5;
		cmp.ymin = cmp.buffer;
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
			"made " + app.fixList(model, "reasons")
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
