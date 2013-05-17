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
		className: "cartofolio_parchment",


		projectgroup: {},
		parchment: {},
		w: '',
		h: '',
		x: '', y: '', ux: '', uy: '', xmin: '', ymin: '', xmax: '', ymax: '', axes: '', leader: '',
		lastX: 0,
		lastY: 0,
		firstRender: true,
		sidebar: 100,
		r: 20,
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
			"click #sortbuttons" : "arrange"
		},

		sizefix: function () {},

		afterRender: function() {
	 	var lay = this;

		if (lay.firstRender) {
			lay.firstRender = false;


			lay.w = $(window).width();
			lay.h = $(window).height();
			lay.s = 2*lay.r/150;
			lay.format = d3.time.format("%Y-%m-%d %H:%M:%S");
			lay.setbuffer();



			lay.d3_dom();
			lay.setup_d3();

			Cartofolio.projects.bind("all", lay.d3_update);

			var rtime = new Date(1, 1, 2000, 12,00,00);
			var timeout = false;
			var delta = 200;
			$(window).resize(function() {
				   rtime = new Date();
				   if (timeout === false) {
						timeout = true;
						setTimeout(resizeend, delta);
				   }
			});

			function resizeend() {
				   if (new Date() - rtime < delta) {
						setTimeout(resizeend, delta);
				   } else {
						timeout = false;
			/*			 console.log("window: " + $(window).width() + ", " + $(window).height()); */
						lay.arrange("random");
				   }
			}
		}
	},

		/*  !cartofolio init	*/
		initialize: function () {
		_.bindAll(this);

		var cmp = this;

	},


		d3_dom: function() {
		var lay = this;

		lay.parchment = d3.select(".cartofolio_wrapper").append("svg")
			.attr("class", "parchment")
			.attr("width", "100%")
			.attr("height", "100%")
			;

		// !buttons

		var sortbuttons = lay.parchment.append("g")
			.attr("id", "sortbuttons");

		var Bscramble = sortbuttons.append("g")
				.attr("class", "link")
				.attr("id", "random")
				;

		Bscramble.append("text") // button text
				.attr("class", "link")
				.text("scramble")
				.attr("x", lay.w-lay.sidebar)
				.attr("y", lay.parchment.selectAll("text.link")[0].length*40);

		Bscramble.insert("ellipse", "text") //background circle
				.attr("class", "link")
				.attr("rx", function () { return Bscramble.select("text")[0][0].clientWidth*3/4; })
				.attr("ry", 20)
				.attr("cx", lay.w-lay.sidebar)
				.attr("cy", lay.parchment.selectAll("text.link")[0].length*40)
				.attr("stroke", "black")
				.attr("stroke-width", "2pt");

		var Bshrink = sortbuttons.append("g")
				.attr("class", "link")
				.attr("id", "shrink")
				;

		Bshrink.append("text") // button text
				.attr("class", "link")
				.text("shrink")
				.attr("x", lay.w-lay.sidebar)
				.attr("y", lay.parchment.selectAll("text.link")[0].length*40);

		Bshrink.insert("ellipse", "text") //background circle
				.attr("class", "link")
				.attr("rx", function () { return Bshrink.select("text")[0][0].clientWidth*3/4; })
				.attr("ry", 20)
				.attr("cx", lay.w-lay.sidebar)
				.attr("cy", lay.parchment.selectAll("text.link")[0].length*40)
				.attr("stroke", "black")
				.attr("stroke-width", "2pt");



		Cartofolio.elders.models.forEach(function(d, i) {
			d.x = $(window).width()/2;
			d.y = $(window).height()/2;
			d.x0 = $(window).width()/2;
			d.y0 = $(window).height()/2;
			d.r = lay.r;
		});

		// !force

		lay.force = d3.layout.force()
			.nodes(Cartofolio.elders.models)
			.on("tick", lay.tick)
			.gravity(0)
			.friction(0.9)
			.start();


		// !nodes


		lay.node = lay.parchment.selectAll(".node")
				.data(Cartofolio.elders.models)
			.enter().append("g")
				.attr("class", "node")
				.call(lay.force.drag);


		lay.node.append("circle")
			.attr("class", "orbcircle")
			.attr("r", lay.r)
			;

		lay.node.append("clipPath")
					.attr("id", function(d) { return d.get("slug"); })
				.append("circle")
					.attr("class", "orbclip")
					.attr("r", lay.r)
					;

		lay.node.append("g")
					.attr("class", "clip_group")
					.attr("clip-rule", "nonzero")
					.attr("id", function(d) { return d.get("slug") + "_to_clip"; })
					.attr("clip-path", function(d) { return "url(#" + d.get("slug") + ")"; })
				.append("image")
					.attr("x", lay.ux(0))
					.attr("y", lay.uy(0))
					.attr("width", 150)
					.attr("height", 150)
					.attr("transform", "scale(" + lay.s + ")")
					.attr("xlink:href", function (d) { return d.get("thumbnail"); })
					;
		d3.selectAll("g.node").on("mouseover", function (d) {
			var cmp = this;
			lay.force.resume();
			d3.transition().tween(d.r, function() {
				var i = d3.interpolate(d.r, 75);
				return function(t) {
					d.r = i(t);
					d3.select(cmp).select("circle.orbclip").attr("r", d.r);
					d3.select(cmp).select("circle.orbcircle").attr("r", d.r);
				};
			});



			d3.select(cmp).select("g.clip_group").transition().attr("transform", "scale(" + 1/lay.s + ")");
		});

		d3.selectAll("g.node").on("mouseout", function (d) {
			lay.force.resume();
			var cmp = this;
			d3.transition().tween(d.r, function() {
				var i = d3.interpolate(d.r, lay.r);
				return function(t) {
					d.r = i(t);
					d3.select(cmp).select("circle.orbclip").attr("r", d.r);
					d3.select(cmp).select("circle.orbcircle").attr("r", d.r);
				};
			});

			d3.select(cmp).select("g.clip_group").transition().attr("transform", "scale(" + 1 + ")");
		});
	},

		setup_d3: function () {

	}, // end d3_setup

		// !force fn's
		tick: function(e) {
		var lay = this;
		 lay.node.each(lay.gravity(e.alpha * 0.7))
			 .each(lay.collide(0.5))
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
		var lay = this;
		var q = d3.geom.quadtree(Cartofolio.elders.models);
		 return function(node) {
			 var nr = node.r + lay.padding,
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
		var lay = this;
		var kind = '';

		if ($(e.target).parent().attr("id") != undefined) { kind = $(e.target).parent().attr("id"); }
		else kind = e;

		console.log("arranging by " + kind);

		lay.setbuffer();

		if (kind == "random") {
			Cartofolio.elders.models.forEach(function(d, i) {
				d.x0 = Math.random()*(lay.xmax-lay.xmin) + lay.xmin+1;
				d.y0 = Math.random()*(lay.ymax-lay.ymin) + lay.ymin+1;
				d.r = lay.r;
			});
		}


		lay.force.resume();
	},

			/* -------------------------------------------------- */


		setbuffer: function() {
		var lay = this;

		lay.w = $(window).width();
		lay.h = $(window).height();

		if (lay.w >= lay.h) {
			lay.buffer = lay.h/5;
			lay.r = Math.round(lay.buffer/4);
		}
		else {
			lay.buffer = lay.w/5;
			lay.r = Math.round(lay.buffer/4);
		}

		lay.s = 2*lay.r/150;
		lay.xmin = lay.buffer;
		lay.xmax = (lay.w-lay.buffer-lay.sidebar);
		lay.ymax = lay.h-lay.buffer*1.5;
		lay.ymin = lay.buffer;
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
