<?php
/* -----------------  custom post types  ------------------- */


add_action( 'init', 'create_post_types' );

function create_post_types() {
	register_post_type( 'project',
		array(
			'labels' => array(
				'name' => __( 'Projects' ),
				'singular_name' => __( 'Project' ),
				'add_new_item' => _x('Add New Project', 'project'),
				'edit_item' => _x('Edit Project', 'project'),
			),
		'public' => true,
		'hierarchical' => true,
		'has_archive' => true,
		'rewrite' => array('slug' => 'projects'),
		'supports' => array( 'title', 'editor', 'thumbnail', 'page-attributes' ),
		'menu_position' => 5
		)
	);
}

add_theme_support( 'post-thumbnails' );

/* --------------------------------------------------------- */


/* -----------------  custom taxonomies  ------------------- */


add_action( 'init', 'spawn_taxonomies' );

function spawn_taxonomies() {
	register_taxonomy(
		'hours',
		'project',
		array(
			'label' => __( 'Hours Spent' ),
			'rewrite' => array( 'slug' => 'hours' )
		)
	);
	
	register_taxonomy(
		'materials',
		'project',
		array(
			'label' => __( 'Materials' ),
			'rewrite' => array( 'slug' => 'material' )
		)
	);
	
	register_taxonomy(
		'techniques',
		'project',
		array(
			'label' => __( 'Techniques Used' ),
			'rewrite' => array( 'slug' => 'technique' )
		)
	);
	
	register_taxonomy(
		'dimensions',
		'project',
		array(
			'label' => __( 'Number of Dimensions' ),
			'rewrite' => array( 'slug' => 'dimensions' )
		)
	);
	
	register_taxonomy(
		'scale',
		'project',
		array(
			'label' => __( 'Scale' ),
			'rewrite' => array( 'slug' => 'scale' )
		)
	);
	
	register_taxonomy(
		'reasons',
		'project',
		array(
			'label' => __( 'Reasons for Making' ),
			'rewrite' => array( 'slug' => 'reason' )
		)
	);
}


/* --------------------------------------------------------- */

?>
