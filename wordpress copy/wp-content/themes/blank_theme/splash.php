<?php
/*
Template Name: Splash
*/
/*


written by sam galison, void design. licensed under a Creative Commons
Attribution-NonCommercial-ShareAlike 3.0 Unported License, 2012.


*/
get_header(); ?>

<style>
body { background: url(/bgimages/background1.jpg) no-repeat fixed center;
		-webkit-background-size: cover;
		-moz-background-size: cover;
		-o-background-size: cover;
		background-size: cover;
		}
</style>

<body style="overflow: hidden;">
<div id="snavbar">
<nav>
	<ul>
 	<?php 
		$parents = get_pages('exclude=5&parent=0&sort_column=menu_order');
		$parentcount = count($parents);
		$counter = 0;
 	?>
	
	<?php
		foreach ( $parents as $page ) {
			$counter++;
			$link = get_page_link( $page->ID );
			$title = $page->post_title;	
			echo '<li>';
			echo '<a href="' . $link . '">' . $title . '</a>';
			$children = get_pages('child_of='.$page->ID.'&parent='.$page->ID);
			if( count( $children ) != 0 ) {
				echo '<ul>';
				foreach ($children as $page) {
					$link = get_page_link( $page->ID );
					$title = $page->post_title;	
					echo '<li>';
					echo '<a href="' . $link . '">' . $title . '</a>';
					echo '</li>';
					}
					echo '</ul>';
			}
			echo '</li>';
			if ($counter != $parentcount) { //if it's not the last one
				echo '<li>&bull;</li>';
			}
		}
	?>
</ul>
</nav>	
</div>




<div class="bodytext" id="leftbar">	
	<div id="logo">
	</div>
		<div id="topnews">
				<?php the_post(); ?>
				<?php
					$paged = (get_query_var('paged')) ? get_query_var('paged') : 1;
					$args= array(
						'category_name' => 'news', // Change these category SLUGS to suit your use.
						'paged' => $paged,
						'posts_per_page' => 3
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
					
					
	</div> <!-- topnews -->
	<?php get_copyright(); ?>
</div> <!-- leftbar -->
					




</body>
</html>