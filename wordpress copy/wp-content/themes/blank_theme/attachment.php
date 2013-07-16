<?php
/**
 * The template for displaying all pages.
 *
 * This is the template that displays all pages by default.
 * Please note that this is the WordPress construct of pages
 * and that other 'pages' on your WordPress site will use a
 * different template.
 *
 * @package WordPress
 * @subpackage Twenty_Eleven
 * @since Twenty Eleven 1.0
 */

get_header(); ?>

		<div id="primary">
			<div id="content" role="main">
				<?php
				$args= array('category_name' => 'quotes', 'orderby' => 'rand', 'posts_per_page' => 1);
				query_posts($args);
				if( have_posts() ) :?>
				<?php while ( have_posts() ) : the_post(); ?>
				
				
				
				
				<div id="insideybox">
				
				<?php 
				echo '"';
				echo get_the_title(); 
				echo '"</br>&nbsp;&nbsp;- ';
				echo get_the_content();
				?>
				
				</div> <!-- #insideybox -->
				
				<?php endwhile; endif; ?>
				<?php wp_reset_query(); ?>

				<?php the_post(); ?>
				
				<h1>
				<?php the_title(); ?>
				</h1>
				</br></br>
				
				
				<div id="attachimg">
				<?php echo wp_get_attachment_image( $post->ID, 'large' ); ?>
				
				</br>
				</br>
				
				<?php echo get_the_excerpt(); ?>
				
				</br>
				</br>
				<hr style="height:1px;border-width:0;color:#000;background-color:#000;margin-bottom:-2px;" />
				</br>
				
				<?php 
				previous_image_link( false, '&laquo; previous photo' );
				echo ' || ';
				next_image_link( false, 'next photo &raquo;' ); 
				?>
				
				</div>
				
			</div><!-- #content -->
			<?php get_footer(); ?>
		</div><!-- #primary -->

