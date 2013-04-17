<?php
/**
 * The base configurations of the WordPress.
 *
 * This file has the following configurations: MySQL settings, Table Prefix,
 * Secret Keys, WordPress Language, and ABSPATH. You can find more information
 * by visiting {@link http://codex.wordpress.org/Editing_wp-config.php Editing
 * wp-config.php} Codex page. You can get the MySQL settings from your web host.
 *
 * This file is used by the wp-config.php creation script during the
 * installation. You don't have to use the web site, you can just copy this file
 * to "wp-config.php" and fill in the values.
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define('DB_NAME', 'redesign');

/** MySQL database username */
define('DB_USER', 'root');

/** MySQL database password */
define('DB_PASSWORD', 'root');

/** MySQL hostname */
define('DB_HOST', 'localhost');

/** Database Charset to use in creating database tables. */
define('DB_CHARSET', 'utf8');

/** The Database Collate type. Don't change this if in doubt. */
define('DB_COLLATE', '');

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define('AUTH_KEY',         'jLp&d*8@fKe(KiRI^!,(W,_<F.bf|ATLq ,5UB,hKy09c@~ze|Z,&_@-]5{w$7ty');
define('SECURE_AUTH_KEY',  '$sl/Aj:1=5qfk9].,`/<FrJ |T4hg%yMm?K.<{t{+[Z[+O0~@GxZqg0omm-vJ];P');
define('LOGGED_IN_KEY',    'bgK]2dfYPySkFTz{_hRz(/k,yl&zfMt}+-V36;=lntPxW/En1[DvPw&g0U5H9]AP');
define('NONCE_KEY',        '_)#Mft=Z3%`?:@9GHiD-:ZBj1+`%dWy,;DX@!VO4sg(l*nA$Ea^7S]y$-)FI^lk0');
define('AUTH_SALT',        '..VvhwFa1lMx:oiPHeeoRK}wV[C)C+`We(q!oLjd9e&1AAp^6Hw7>Y zP,e1JPFB');
define('SECURE_AUTH_SALT', 'mB?F8idB,+}>Ch,D_}F*+`1D)rfIbP+1 t1*|GJ_,ms_7[N3=TyeiblnazFn3M:K');
define('LOGGED_IN_SALT',   'g7:9Rkh{}sCT&Zki*c5ok)0iac?*6Jhy$y[t=:2?wBpsqJxUFfL`vj<L1U::G4D3');
define('NONCE_SALT',       'K/_#@x)E_yFA`5k6$XOKJNndhL,4%x}!3bk%x$sj$}7997t{-Pk>r*QHQ&73V~^#');

/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each a unique
 * prefix. Only numbers, letters, and underscores please!
 */
$table_prefix  = 'wp_';

/**
 * WordPress Localized Language, defaults to English.
 *
 * Change this to localize WordPress. A corresponding MO file for the chosen
 * language must be installed to wp-content/languages. For example, install
 * de_DE.mo to wp-content/languages and set WPLANG to 'de_DE' to enable German
 * language support.
 */
define('WPLANG', '');

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 */
define('WP_DEBUG', false);

/* That's all, stop editing! Happy blogging. */

/** Absolute path to the WordPress directory. */
if ( !defined('ABSPATH') )
	define('ABSPATH', dirname(__FILE__) . '/');

/** Sets up WordPress vars and included files. */
require_once(ABSPATH . 'wp-settings.php');
