<?php
/*
Plugin Name: Extra Post Metadata
Description: adds extra meta fields
Version: 1.0
Author: Sam Galison
Author URI: http://samgalison.com
License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
*/

/* Define the custom box */

add_action( 'add_meta_boxes', 'extrameta_add_custom_box' );

// backwards compatible (before WP 3.0)
// add_action( 'admin_init', 'extrameta_add_custom_box', 1 );

/* stuff with the data entered */
add_action( 'save_post', 'extrameta_save_postdata' );

/* add boxes to post types */
function extrameta_add_custom_box() {
    add_meta_box(
    	'active',
        __( ':: Project status ::', 'press_textdomain' ),
        'activebox',
        'project'
    );
 }

function activebox( $post ) {
	// Use nonce for verification
	wp_nonce_field( plugin_basename( __FILE__ ), 'extrameta_noncename' );

	// The actual fields for data entry
	
	$is_active = get_post_meta($post->ID, 'is_active', true);
	if ($is_active == "") $is_active = "false";
	// show what's already set
	
	echo '<input type="radio" name="is_active" value="true"';
	if ($is_active == 'true') echo ' checked';
	echo '> this project is ongoing<br/>';
	echo '<input type="radio" name="is_active" value="false"';
	if ($is_active == 'false') echo ' checked';
	echo '> this project is finished<br/>';

}



/* save custom data */
function extrameta_save_postdata( $post_id ) {
	// check for autosave; if so, do nothing
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE )
	  return;

	// check nonce for authorization

	if ( !wp_verify_nonce( $_POST['extrameta_noncename'], plugin_basename( __FILE__ ) ) )
	  return;


	// check permissions
	if ( 'page' == $_POST['post_type'] )
	{
	if ( !current_user_can( 'edit_page', $post_id ) )
	    return;
	}
	else
	{
	if ( !current_user_can( 'edit_post', $post_id ) )
	    return;
	}

	// authenticated!

		$is_active = array($_POST['is_active'], 'is_active');

		$projectmetas = array($is_active);
		
		foreach ($projectmetas as $item) {
			update_post_meta($post_id, $item[1], $item[0]);
			/*

			if ($item[0]) {
				if ($item[1] === 'blurb') {
					if ($item[0] === $fake_blurb || $item[0] === 'REMOVE') delete_post_meta($post_id, $item[1]);
					else update_post_meta($post_id, $item[1], $item[0]);
				}
				else if ($item[1] === 'details') {
					if ($item[0] === $fake_details || $item[0] === 'REMOVE') delete_post_meta($post_id, $item[1]);
					else update_post_meta($post_id, $item[1], $item[0]);
				}
				else {
					if ($item[0] === 'REMOVE') delete_post_meta($post_id, $item[1]);
					else update_post_meta($post_id, $item[1], $item[0]);
				}
			}
*/
		}

}
?>