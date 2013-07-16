<?php
/**
 * @package WordPress
 * @subpackage Classic_Theme
 */
?>
<!-- begin sidebar -->

<div id="menu">
<div id="logo">
<a href=/ title="home">
<img src="/logo.png" width="250" alt="xxxx" />
</a>
</div>
<ul>
<?php 	/* Widgetized sidebar, if you have the plugin installed. */
		if ( !function_exists('dynamic_sidebar') || !dynamic_sidebar() ) : ?>
	<?php wp_list_pages('title_li=&exclude=7'); ?>

<?php endif; ?>

</ul>
</div>
<!-- end sidebar -->
