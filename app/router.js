define([
  // Application.
  "app",
  "modules/cartofolio"
],

function(app, Cartofolio) {

  // Defining the application router, you can attach sub routers here.
	var mainrouter = Backbone.Router.extend({

		initialize: function () {

			app.layouts.mondo = new Backbone.Layout({
		  		template: "mondo",
		  		el: "body"
	  		});
	  		app.layouts.mondo.render();	  		
	  		
			console.log("router initializing...");
			
			mainrouter.getPosts(function (data) {			
				_.each(data.posts, function(post) {
					app.numprojects++;
					Cartofolio.projects.add(post);
					
				});
				Cartofolio.extractElders();
			});
			
			app.layouts.nav = new pageView({
				template: "nav",
				attributes: {
					name: "nav"
				}
			});
			app.layouts.home = new pageView({
				template: "home",
				attributes: {
					name: "home"
				}
			});
			app.layouts.contact = new pageView({
				template: "contact",
				attributes: {
					name: "contact"
				}
			});
			app.layouts.resumes = new pageView({
				template: "resumes",
				attributes: {
					name: "contact"
				}
			});
			
			app.layouts.debug = new pageView({
				template: "debug",
				className: "debug",
				attributes: {
					name: "debug"
				}
			});
			
			app.layouts.skel = new Cartofolio.Views.Skeletonview({
				
			});
			app.layouts.carto = new Cartofolio.Views.Mapview({});
			
			app.layouts.mondo.insertView(app.layouts.debug).render();

			

		},
		
	/* !routes */
	routes: {
		"carto": "carto",
		"skeleton": "skeleton",
		"contact": "contact",
		"resumes": "resumes",
		"debug": "debug",
		"": "index",
		"*splat": "splatter"
	},

	carto: function() {
		console.log("carto route");
		app.layouts.mondo.setView(".container", app.layouts.carto).render();			
	},
	
	skeleton: function() {
		console.log("skeleton route");
		app.layouts.mondo.setView(".nav", app.layouts.nav).render();
		app.layouts.mondo.setView(".container", app.layouts.skel).render();
		//app.layouts.skel.showprojects();
	},
	contact: function() {
		console.log("contact route");
		app.layouts.mondo.setView(".nav", app.layouts.nav).render();
		app.layouts.mondo.setView(".container", app.layouts.contact).render();
	},
	resumes: function() {
		console.log("resumes route");
		app.layouts.mondo.setView(".nav", app.layouts.nav).render();
		app.layouts.mondo.setView(".container", app.layouts.resumes).render();
	},
	
	debug: function() {
		$(".nav").fadeOut("slow");
		$(".debug").text('elders models:');
		console.log(_(Cartofolio.elders.models).map(function (model) {
				return model.get("title");
		}));
		_(Cartofolio.elders.models).map(function (model) {
				$(".debug").append("</br>" + model.get("title"));
		});
	},
	
	index: function() {
		console.log("index route called.");
		if ($(".nav").length) {
			$(".nav").fadeOut("slow", function() {
				app.layouts.mondo.setView(".container", app.layouts.home).render();
			});
		}
		else {
			app.layouts.mondo.setView(".container", app.layouts.home).render();
		}
	},

	splatter: function (splat) {
		console.log("splat");
		this.navigate("", { trigger: true });
	}

	});

	mainrouter.getPosts = function(callback) {

		var localcheck = document.URL.search("samgalison.com");
		//console.log("url: " + document.URL + " - samgalison.com at pos. " + localcheck);
		if (localcheck == -1) {
			// we're not on the web
			console.log("==== get posts: operating locally ====");

			$.post("http://localhost/redesign/wordpress/?json=get_recent_posts&post_type=project&count=0", function(data) {
				callback(data);
			});
		}

		else {
			// we're live!
			console.log("==== get posts: operating online ====");

			$.post("../wordpress/?json=get_recent_posts&post_type=project&count=0", function(data) {
				callback(data);
			});
		}

	};
	
	/* !page view */
	var pageView = Backbone.Layout.extend({
	
		collection: Cartofolio.elders,
		
		initialize: function () {
			
			this.collection.on("reset", function () {
				//console.log("elders reset");
			});
			
			if (typeof this.attributes.name !== "undefined") {
				console.log("page view init: " + this.attributes.name);
				if (this.template != "home") {
				}
				else {
				}
			}
		}
	});
	
	function switchTo( newlayout ) {
		console.log("switching view to " + newlayout.attributes.name);
		if ($(".container").length) {
			$(".container").fadeOut("fast", function(){
				app.layouts.mondo.setView(".container", app.layouts.resumes).render();
				$(".container").fadeIn("fast");
			});
		}
	}

  return mainrouter;

});
