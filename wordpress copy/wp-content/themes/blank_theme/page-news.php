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
					$paged = (get_query_var('paged')) ? get_query_var('paged') : 1;
					$args= array(
						'category_name' => 'news', // Change these category SLUGS to suit your use.
						'paged' => $paged
					);
					query_posts($args);
					if( have_posts() ) :?>
					
					<?php while ( have_posts() ) : the_post(); ?>
					<div id="singlepost"> 
					<h2>
					<?php the_title(); ?>
					</h2>
					
					<h3>
					<?php
					echo('posted on ');
					echo get_the_date( 'F jS, Y' );
					?>
					</h3>
					<?php the_excerpt(); ?>
					<a href="<?php echo get_permalink(); ?>"> Read the full article...</a>
					</div> <!-- singlepost -->
					
					
					
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


