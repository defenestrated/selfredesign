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
			this.collection.on("reset", function () { // wait for the collection to be populated before showing
					console.log("elders reset");
					lay.showprojects();
				});			
		}
		if (this.collection.length != 1) { // if it's already been loaded, the reset won't ever fire, so just show it
			if (lay.firstRender) lay.showprojects();
		}
		else {
/* 			!BROKEN */
			// the appending and showing has to be separated
		}
		lay.firstRender = false;
	  },
	  
	  sizefix: function () {},
	  
	  showprojects: function() {
	  	var lay = this;
	  	
		_.each(Cartofolio.elders.models, function(model) { // append divs to the DOM
			
			lay.$el
				.append("<div class='skelback'><div class='skelproj' id='" + model.get("slug") + "'></div></div>");
				$("#" + model.get("slug")).css("background", 'url("' + model.get("thumbnail") + '") no-repeat center center')
					.css("-webkit-background-size", "cover")
					.css("-moz-background-size", "cover")
					.css("-o-background-size", "cover")
					.css("background-size", "cover");
				
				
				var date = app.fixDate(model);
				var materials = app.fixList(model, "materials");
				
				// add content
				$("#" + model.get("slug")).html('<h1>'+ model.get("title") + '</h1><h2>' + date + '</h2><h2>' + materials + '</h2>');
				$("#" + model.get("slug")).click(function () {
					var somerouter = new Backbone.Router({});
					somerouter.navigate('projects/' + model.get("slug"), {trigger:true});
				});
		});
		$(".skeleton").css("height", $(".container").height()+4 + "px");

/* !---- mouse behavior stuff ---- */

	  	$(".skelback").mouseenter(function () {
	  		$(this).animate({"background-color": "rgba(0,0,0,0.7)"}, 100, "easeInQuad");
	  		$(this).children(".skelproj").animate({"color": "rgb(251,255,103)"}, 100, "easeInQuad");
	  	});
	  	$(".skelback").mouseleave(function () {
	  		$(this).animate({"background-color": "rgba(0,0,0,0.5)"}, 100, "easeInQuad");
	  		$(this).children(".skelproj").animate({"color": "white"}, 400, "easeInQuad");
	  	});
	  	
		
/* !---- cyclical project fades ---- */
		var count = 0;
		(function shownext(jq){
			jq.eq(0).fadeIn(300, "easeInQuad", function(){
				$(".skelproj").eq(count).fadeIn(600, "easeInQuad");
			    (jq=jq.slice(1)).length && shownext(jq);
			    count++;
			});
		})($('div.skelback'));
	  }
	  
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
			/*         console.log("window: " + $(window).width() + ", " + $(window).height()); */
			        lay.arrange("random");
			    }               
			}
		}
    },
		
		/*  !cartofolio init  */
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
		var lay = this;
		var model = this.model;
		
		lay.$el
			.append('<div class="sidebar"></div>')
			.append('<div class="mainstage"></div>')
			.append('<img class="little_thumb" src="' + model.get("thumbnail") + '"></img>')
		;
		
		$(".sidebar").append("<table class='sidetable' cellspacing='0' cellpadding='0'></table>");
		
		$("table.sidetable")
			.append('<tr><th>' + model.get("title") + '<th></tr>')
			.append('<tr><td>' + app.fixDate(model) + '</td></tr>')
			.append('<tr><td>took ' + model.get("hours") + ' hours of work</td></tr>')
			.append('<tr><td>made with ' + app.fixList(model, "materials") + '</td></tr>')
			.append('<tr><td>used ' + app.fixList(model, "techniques") + '</td></tr>')
			.append('<tr><td>occupies ' + model.get("dimensions") + ' dimensions</td></tr>')
			.append('<tr><td>takes up ' + app.fixScale(model) + '</td></tr>')
			.append('<tr><td>made ' + app.fixList(model, "reasons") + '</td></tr>')
		;
		
		$(".mainstage")
			.append('<img class="content_thumb" src="' + model.get("thumbnail") + '"></img>')
			.append('<div class="maincontent">' + model.get("content") + '</div>')
		;
		
		this.sizefix();
	},
	
	sizefix: function () {
		if ( app.shouldBeSkinny ) {
			$(".container").css({
		  		"overflow": "auto"
	  		});
	  		
  			$(".sidebar").css({
  				"width": $(".container").width()/2 + "px",
  				"height": "auto",
  				"padding": "0px",
  				"float": "left"
				});
			
			$(".sidebar th").css({
				"height": "auto",
				"padding": "0 0 5px 0",
				"font-size": "20px"
			});
			
			$(".sidebar td").css({
				"height": "auto",
				"padding": "5px 0",
				"font-size": "10px"
			});
			
			$(".mainstage").css({
				"overflow": "hidden",
				"left": 0,
				"top": $(".sidebar").height() + "px",
				"width": widthcalc("little") + "px"					
			});
			
			if ($(".content_thumb").is(":visible")) $(".content_thumb").hide();
			$(".little_thumb").css({
				"left": $(".sidebar").width()+($(".container").width()-$(".sidebar").width()-$(".little_thumb").outerWidth())/2,
				"top": ($(".sidebar").height()-$(".little_thumb").outerHeight())/2
			});
			$(".little_thumb").show();
		}
		else {
			if ($(".container").width()/4 < 300) $(".sidebar").css("width", "300px");
	  		else if ($(".container").width()/4 >= 300) $(".sidebar").css("width", $(".container").width()/4 + "px");
	  		
			$(".container").css({
		  		"overflow": "hidden"
	  		});
	  		
	  		$(".sidebar").css({
					"height": $(".container").height() + "px",
					"padding": "",
					"clear": "both"
				});
			
			$(".sidebar th").css({
				"padding": "",
				"font-size": "20px"
			});
			
			$(".sidebar td").css({
				"padding": "",
				"font-size": ""
			});
	  		
	  		if (!$(".content_thumb").is(":visible")) $(".little_thumb").hide();
			$(".content_thumb").show();
	  		
			var available = $(".sidebar").height();
			$(".sidebar th").css("height", available/($(".sidebar td").length + 1) + "px");
			$(".sidebar td").css("height", available/($(".sidebar td").length + 1) + "px");

			$(".mainstage").css({
				"overflow": "auto",
				"left": $(".sidebar").outerWidth() + "px",
				"top": "",
				"height": $(".container").height() + "px",
				"width": widthcalc("big") + "px",
				"padding-right": $(".container").width()-$(".sidebar").outerWidth()-widthcalc("big") + "px"
			});
		}
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
	
	
  });

  // Return the module for AMD compliance.
  return Cartofolio;

});
