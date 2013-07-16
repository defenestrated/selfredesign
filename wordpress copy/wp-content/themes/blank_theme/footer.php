<?php
/**
 * @package WordPress
 * @subpackage Classic_Theme
 */
?>
<!-- begin footer -->


<div id="navbar">
	
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


<?php get_copyright(); ?>

<?php wp_footer(); ?>
</body>
</html>