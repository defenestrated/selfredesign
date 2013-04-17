<?php
/*
Template Name: News
*/
/*


written by sam galison, void design. licensed under a Creative Commons
Attribution-NonCommercial-ShareAlike 3.0 Unported License, 2012.


*/

get_header(); ?>

<?php the_post(); ?>

	<div id="pagetitle">
	<?php the_title(); ?>
	</div>
	
	<div id="primary">
		<div class="bodytext" id="content" role="main">
			<div id="guts">
			
			<?php the_post(); ?>
				<?php
					$toggle = 0;
					$paged = (get_query_var('paged')) ? get_query_var('paged') : 1;
					$args= array(
						'category_name' => 'shows', // Change these category SLUGS to suit your use.
						'paged' => $paged
					);
					query_posts($args);
					if( have_posts() ) :?>
					
					
					
					<?php while ( have_posts() ) : the_post(); ?>		
					
					<?php echo '<a href="' . get_permalink($post->ID) . '">'; ?>
					
					<?php
					$post_image_id = get_post_thumbnail_id($post->ID);
					if ($post_image_id) {
						$thumbnail = wp_get_attachment_image_src( $post_image_id, 'post-thumbnail', false);
						if ($thumbnail) (string)$thumbnail = $thumbnail[0];
					}
					?>
					<div class="singleshow" style="background: url('<?php echo $thumbnail; ?>') no-repeat top center; 
					-webkit-background-size: cover;
					-moz-background-size: cover;
					-o-background-size: cover;
					background-size: cover;">
					
								
					<div id="singleshowtitle">
					<?php the_title(); ?>
					</div> <!-- #singleshowtitle -->
					
					
					</div> <!-- .singleshow -->
					
					</a>
					
					
					
					<?php endwhile; ?>
					
					<?php else : ?>
					<article id="post-0" class="post no-results not-found">
					<header class="entry-header">
					<h1 class="entry-title"><?php _e( 'Nothing Found', 'twentyeleven' ); ?></h1>
					</header><!-- .entry-header -->
					
					<div class="entry-content">
					<p><?php _e( 'No posts here - sorry!' ); ?></p>
					</div> <!-- entry-content -->
					<?php endif; ?>
			</div> <!-- #guts -->
		</div><!-- #content -->
	</div><!-- #primary -->
<?php get_footer(); ?>


