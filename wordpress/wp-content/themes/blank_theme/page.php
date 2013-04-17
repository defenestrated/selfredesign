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

<?php the_post(); ?>

	<div id="pagetitle">
	<?php the_title(); ?>
	</div>
	
	<div id="primary">
		<div class="bodytext" id="content" role="main">
			<div id="guts">
			
			</br></br>
			
			<?php the_content(); ?>

			<?php get_template_part( 'content', 'page' ); ?>
			
			
			</div> <!-- #guts -->
		</div><!-- #content -->
	</div><!-- #primary -->
<?php get_footer(); ?>


