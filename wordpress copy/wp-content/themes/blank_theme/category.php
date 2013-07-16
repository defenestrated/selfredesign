<?php get_header(); ?>
<?php if (is_category()) : ?>
<?php $cat_id = get_query_var('cat'); ?>
<?php echo 'category id of ' . get_the_category_by_ID( $cat_id ) . ' is ' . $cat_id; ?>
<?php
$catdepth = get_category_level();
echo '</br>catdepth is ' . $catdepth;
$leftpush = $catdepth * 200;
$leftpush = $leftpush + 200;
echo '</br>leftpush is ' . $leftpush;

?>

<div class="bodytext" id="sidelinks">
<?php
wp_list_categories('orderby=id&hide_empty=0&depth=0&show_count=1&title_li=&depth=1&style=list');
?>
</div>

<?php
 if ($catdepth > 0) {
 	$minileft = $leftpush - 200;
	echo '<div class="pushcart" style="left:' . $minileft . 'px;">';
	$catparent_list = get_category_parents($cat, TRUE, ' || ');
	echo '# of parents: ' . substr_count( $catparent_list, '||' );

$this_category = get_category($cat);
 	//if category is parent
	 if ($this_category->category_parent != 0) { 
	// if category is not parent, list parent category
	 $parent_category = get_category($this_category->category_parent); 

		 //echo get_category_link($parent_category->cat_ID); 
		 //echo $parent_category->cat_name; 
		 $getParentCatId = $parent_category->cat_ID; 
		 //echo $getParentCatId; 
	 }
	 
wp_list_categories('orderby=id&hide_empty=0&show_count=1&title_li=&depth=1&style=list&child_of=' . $getParentCatId);
 echo '</div>';
 }

$catlist = get_categories('hide_empty=0'); // generate full category list
$count=0; // initialize counter
foreach ( (array) $catlist as $cat ) { // go through the list
if ($cat->category_parent==$cat_id) { // if the category has the current one as a parent
$count++; // increment count
}
}
echo '<div class="pushcart" style="left:' . $leftpush . 'px;">';

if ($count == 0) { // if there are no children
echo '</br></br>no children';

query_posts('cat=' . $cat_id);
while (have_posts()): the_post();
      	echo '<div class="littlebox">';
  		echo '<h1>';
  		the_title();
  		echo '</h1><h2>&nbsp;&nbsp;&nbsp;';
        echo get_the_date( 'j F Y' );
        echo '</h2>';
        the_content();
        echo '</div>';
		endwhile;
}

else if ($count > 0) { // there are children
// echo "</br>there are " . $count . " children </br>";
wp_list_categories('orderby=id&hide_empty=0&show_count=1&title_li=&depth=1&style=0&child_of=' . $cat_id);
}

echo '</div>';

?>



<?php endif; ?>