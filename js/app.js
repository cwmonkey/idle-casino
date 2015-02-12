var game_items = {
	slot_machine: {
		id: 'slot_machine',
		name: 'Slot Machine',
		description: 'Generates revenue from willing patrons',
		cost: 100,
		prestige: 1,
		power_usage: 1,
		durability: 50,
		revenue: 5
	},
	generator: {
		id: 'generator',
		name: 'Generator',
		description: 'Generates power for electrical equipment',
		cost: 100,
		power_gen: 5,
		durability: 50,
		tick_cost: 10
	},
	vault: {
		id: 'vault',
		name: 'Vault',
		description: 'Increases on-site money storage',
		cost: 100,
		durability: 50,
		vault: 1000
	}
};

(function() {

var ticks_per_second = 1;
var rows = 20;
var columns = 20;
var start_date;
var start_ms;
var now_date;
var now_ms;
var ticks;
var i;
var j;
var casino_items = [];
var $casino = document.getElementById('casino');
var $items = document.getElementById('items');
var $money = document.getElementById('money');
var $power = document.getElementById('power');
var $vault = document.getElementById('vault');
var $prestige = document.getElementById('prestige');
var selected_reg = / \( selected \)/;
var selected_class = ' ( selected )';
var disabled_reg = / \( disabled \)/;
var disabled_class = ' ( disabled )';
var selected_item = null;
var casino_item_reg = / \( [a-z_]+ \)/g;
var info_updated = false;
var base_vault = 1000;

var money = 1000;
var power = 0;
var prestige = 0;
var vault = base_vault;

// Update variables, I guess
var update_info = function() {
	power = 0;
	prestige = 0;
	vault = base_vault;

	for ( i = 0; i < rows; i++ ) {
		for ( j = 0; j < columns; j++ ) {
			var settings = casino_items[i][j];
			var up = ( i ) ? casino_items[i - 1][j] : null;
			var down = ( i < rows - 1 ) ? casino_items[i + 1][j] : null;
			var left = ( j ) ? casino_items[i][j - 1] : null;
			var right = ( j < columns - 1 ) ? casino_items[i][j + 1] : null;

			if ( settings && settings.item_id ) {
				var item = game_items[settings.item_id];

				if ( settings.durability ) {
					if ( item.power_gen ) {
						power += item.power_gen;
					}

					if ( item.vault ) {
						vault += item.vault;
					}

					if ( item.prestige ) {
						prestige += item.prestige;
					}
				} else if ( item.prestige ) {
					prestige -= item.prestige;
				}
			}
		}
	}

	$prestige.innerHTML = prestige;
	$power.innerHTML = power;
	$vault.innerHTML = vault;
	info_updated = true;
}

// Apply item attributes
var do_item = function(settings, up, down, left, right) {
	if ( !settings.item_id ) {
		return;
	}

	var item = game_items[settings.item_id];

	if ( settings.durability && ( !item.power_usage || item.power_usage <= power )  ) {
		settings.durability--;
		if ( item.power_usage ) {
			power -= item.power_usage;
			$power.innerHTML = power;
		}

		var revenue = item.revenue || 0;

		if ( revenue ) {
			// If the vault is full, deduct 20% from revenue
			if ( money >= vault ) {
				revenue = Math.floor(revenue * .8);
			}
		}

		money += revenue;
		$money.innerHTML = money;
		if ( !settings.durability ) {
			settings.$element.className += disabled_class;
		}

		settings.$element.title = item.name + ' - Durability: ' + settings.durability + '/' + item.durability;
	}
};

var real_tick = function() {
	if ( !info_updated ) {
		update_info();
	}

	for ( i = 0; i < rows; i++ ) {
		for ( j = 0; j < columns; j++ ) {
			var settings = casino_items[i][j];
			var up = ( i ) ? casino_items[i - 1][j] : null;
			var down = ( i < rows - 1 ) ? casino_items[i + 1][j] : null;
			var left = ( j ) ? casino_items[i][j - 1] : null;
			var right = ( j < columns - 1 ) ? casino_items[i][j + 1] : null;

			if ( settings ) {
				do_item(settings, up, down, left, right);
			}
		}
	}

	info_updated = false;
};

// Make sure the correct amount of ticks fire in case of lag or something
var tick = function() {
	now_date = new Date();
	now_ms = now_date.getTime();

	//ticks = Math.floor( (now_ms - start_ms) / (1000 / ticks_per_second) );

	//for ( i = 1; i <= ticks; i++ ) {
		real_tick();
	//}

	setTimeout(tick, 1000 / ticks_per_second);
};

// Make rows
for ( i = 0; i < rows; i++ ) {
	var row = [];
	var $row = document.createElement('div');

	for ( j = 0; j < columns; j++ ) {
		var $element = document.createElement('button');
		var settings = {
			$element: $element,
			row: i,
			column: j,
			item_id: null,
			durability: 0
		};

		$element.className = 'empty';
		$element._settings = settings;
		row.push(settings);
		$row.appendChild($element);
	}

	casino_items.push(row);
	$casino.appendChild($row);
}

// Make placeable game items
for ( var prop in game_items ) {
	if ( game_items.hasOwnProperty(prop) ){
		var item = game_items[prop];
		var $element = document.createElement('button');
		$element.className = item.id;
		$element.title = item.name;
		$items.appendChild($element);
		$element._item = item;
	}
}

// Bind events
$items.onclick = function(e) {
	var $element = e.target;

	if ( $element.tagName != 'BUTTON' ) return;

	var item = $element._item;
	var selected = $element.className.match(selected_reg);

	var elements = $items.getElementsByTagName('button');
	var $el;
	for ( i = 0; i < elements.length; i++ ) {
		$el = elements[i];
		$el.className = $el.className.replace(selected_reg, '');
	}

	if ( selected ) {
		selected_item = null;
	} else {
		selected_item = $element._item;
		$element.className += selected_class;
	}
};

// Bind events
$casino.onclick = function(e) {
	var $element = e.target;

	if ( $element.tagName != 'BUTTON' ) return;

	if ( !selected_item || $element._settings.item_id ) {
		if ( !$element._settings.item_id ) return;

		var item = game_items[$element._settings.item_id];
		$element._settings.durability = item.durability;
		$element.className = $element.className.replace(disabled_reg, '');
		
		money -= item.cost / 2;
		update_info();
		return;
	};

	$element._settings.item_id = selected_item.id;
	$element._settings.durability = selected_item.durability;
	money -= selected_item.cost;
	$money.innerHTML = money;

	$element.className = $element.className.replace(casino_item_reg, '') + ' ( ' + selected_item.id + ' )';
};

$casino.oncontextmenu = function(e) {
	var $element = e.target;

	if ( $element.tagName != 'BUTTON' ) return;

	$element._settings.item_id = null;

	$element.className = $element.className.replace(casino_item_reg, '')

	return false;
};

// Start game
start_date = new Date();
start_ms = start_date.getTime();

$money.innerHTML = money;
$vault.innerHTML = vault;

setTimeout(tick, 1000 / ticks_per_second);

})();