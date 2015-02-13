var game_items = {
	slot_machine: {
		id: 'slot_machine',
		name: 'Slot Machine',
		type: 'machine',
		description: 'Generates revenue from willing patrons',
		cost: 100,
		prestige: 1,
		power_usage: 1,
		break_chance: 0.01,
		enforced: 50,
		revenue: 5
	},
	generator: {
		id: 'generator',
		name: 'Generator',
		type: 'machine',
		description: 'Generates power for electrical equipment',
		cost: 100,
		power_gen: 5,
		break_chance: 0.01,
		enforced: 50,
		tick_cost: 10
	},
	vault: {
		id: 'vault',
		name: 'Vault',
		type: 'machine',
		description: 'Increases on-site money storage',
		cost: 100,
		power_usage: 1,
		break_chance: 0.01,
		enforced: 50,
		vault: 1000
	},
	carpet_leftright: {
		id: 'carpet_leftright',
		name: 'Carpet - Left/Right',
		type: 'furniture',
		description: 'Doubles prestige of items above/below (does not stack)',
		cost: 10,
		break_chance: 0.01,
		enforced: 50,
		prestige: 1,
		boost_prestige_up: 2,
		boost_prestige_down: 2
	},
	carpet_updown: {
		id: 'carpet_updown',
		name: 'Carpet - Up/Down',
		type: 'furniture',
		description: 'Doubles prestige of items left/right (does not stack)',
		cost: 10,
		break_chance: 0.01,
		enforced: 50,
		prestige: 1,
		boost_prestige_left: 2,
		boost_prestige_right: 2
	},
	janitor_closet: {
		id: 'janitor_closet',
		name: 'Janitor\'s Closet',
		type: 'janitor_closet',
		description: 'Allows you to hire janitors',
		cost: 10,
		power_usage: 1,
		janitors: 1
	},
	engineer_room: {
		id: 'engineer_room',
		name: 'Engineering Room',
		type: 'engineer_room',
		description: 'Allows you to hire engineers',
		cost: 50,
		power_usage: 1,
		engineers: 1
	}
};

(function() {

var ticks_per_second = 2;
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
var $janitors_max = document.getElementById('janitors_max');
var $janitors = document.getElementById('janitors');
var $janitor_add = document.getElementById('janitor_add');
var $janitor_remove = document.getElementById('janitor_remove');
var $engineers_max = document.getElementById('engineers_max');
var $engineers = document.getElementById('engineers');
var $engineer_add = document.getElementById('engineer_add');
var $engineer_remove = document.getElementById('engineer_remove');
var janitoring_reg = / \( janitoring \)/;
var janitoring_class = ' ( janitoring )';
var engineering_reg = / \( engineering \)/;
var engineering_class = ' ( engineering )';
var selected_reg = / \( selected \)/;
var selected_class = ' ( selected )';
var disabled_reg = / \( disabled \)/;
var disabled_class = ' ( disabled )';
var selected_item = null;
var casino_item_reg = / \( [a-z_]+ \)/g;
var info_updated = false;
var base_vault = 1000;
var janitors_used;
var engineers_used;
var fix_required = 5;
var no_power_threshold = 5;

var janitor_cost = 10;
var engineer_cost = 50;
var money = 1000;
var power = 0;
var prestige = 0;
var janitors_max = 0;
var janitors = 0;
var engineers_max = 0;
var engineers = 0;
var vault = base_vault;

// Update variables, I guess
var update_info = function() {
	power = 0;
	prestige = 0;
	vault = base_vault;
	janitors_max = 0;
	engineers_max = 0;

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

					if ( item.janitors ) {
						janitors_max += item.janitors;
					}

					if ( item.engineers ) {
						engineers_max += item.engineers;
					}

					if ( item.prestige ) {
						var boost_prestige = 1;

						if ( up ) {
							var up_item = game_items[up.item_id];
							if ( up_item && up_item.durability && ( !up_item.power_usage || up_item.power_usage <= power ) ) {
								if ( up_item.boost_prestige_down && up_item.boost_prestige_down > boost_prestige ) {
									boost_prestige = up_item.boost_prestige_down;
								}
							}
						}

						if ( down ) {
							var down_item = game_items[down.item_id];
							if ( down_item && down_item.durability && ( !down_item.power_usage || down_item.power_usage <= power ) ) {
								if ( down_item.boost_prestige_up && down_item.boost_prestige_up > boost_prestige ) {
									boost_prestige = down_item.boost_prestige_up;
								}
							}
						}

						if ( left ) {
							var left_item = game_items[left.item_id];
							if ( left_item && left_item.durability && ( !left_item.power_usage || left_item.power_usage <= power ) ) {
								if ( left_item.boost_prestige_right && left_item.boost_prestige_right > boost_prestige ) {
									boost_prestige = left_item.boost_prestige_right;
								}
							}
						}

						if ( right ) {
							var right_item = game_items[right.item_id];
							if ( right_item && right_item.durability && ( !right_item.power_usage || right_item.power_usage <= power ) ) {
								if ( right_item.boost_prestige_left && right_item.boost_prestige_left > boost_prestige ) {
									boost_prestige = right_item.boost_prestige_left;
								}
							}
						}

						prestige += item.prestige * boost_prestige;
					}
				} else if ( item.prestige ) {
					prestige -= item.prestige;
				}
			}
		}
	}

	if ( janitors > janitors_max ) {
		janitors = janitors_max;
	}

	if ( engineers > engineers_max ) {
		engineers = engineers_max;
	}

	$prestige.innerHTML = prestige;
	$power.innerHTML = power;
	$vault.innerHTML = vault;
	$janitors_max.innerHTML = janitors_max;
	$janitors.innerHTML = janitors;
	$engineers_max.innerHTML = engineers_max;
	$engineers.innerHTML = engineers;
	info_updated = true;
}

// Apply item attributes
var do_item = function(settings, up, down, left, right) {
	if ( !settings.item_id ) {
		return;
	}

	var item = game_items[settings.item_id];

	if ( item.type == 'janitor_closet' ) {
		if ( item.power_usage > power && janitors ) {
			settings.no_power_ticks++;
			if ( settings.no_power_ticks == no_power_threshold ) {
				settings.no_power_ticks = 0;
				janitors--;
				$janitors.innerHTML = janitors;
			}
		}
	} else if ( item.type == 'engineer_room' ) {
		if ( item.power_usage > power && engineers ) {
			settings.no_power_ticks++;
			if ( settings.no_power_ticks == no_power_threshold ) {
				settings.no_power_ticks = 0;
				engineers--;
				$engineers.innerHTML = engineers;
			}
		}
	} else if ( settings.durability && ( !item.power_usage || item.power_usage <= power ) ) {
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
		if ( settings.enforced ) {
			settings.enforced--;
			settings.$element.title = item.name + ' (Enforced: ' + settings.enforced + ')';
		} else if ( Math.random() < item.break_chance ) {
			settings.durability = 0;
			settings.$element.className += disabled_class;
			settings.$element.title = item.name + ' (Broken down)';
		} else {
			settings.$element.title = item.name + ' (Breakdown Chance: ' + item.break_chance + ')';
		}
	}

	if ( item.type == 'furniture' && !settings.durability && janitors_used ) {
		janitors_used--;
		settings.fix++;

		if ( settings.fix == 1 ) {
			settings.$element.className += janitoring_class;
		} else if ( settings.fix == fix_required ) {
			settings.durability = 1;
			settings.enforced = item.enforced;
			settings.fix = 0;
			settings.$element.className = settings.$element.className.replace(disabled_reg, '').replace(janitoring_reg, '');
			settings.$element.title = item.name + ' (Enforced: ' + settings.enforced + ')';
		} else {
			settings.$element.title = item.name + ' (Broken down, being fixed ' + settings.fix + '/' + fix_required;
		}
	}

	if ( item.type == 'machine' && !settings.durability && engineers_used ) {
		engineers_used--;
		settings.fix++;

		if ( settings.fix == 1 ) {
			settings.$element.className += engineering_class;
		} else if ( settings.fix == fix_required ) {
			settings.durability = 1;
			settings.enforced = item.enforced;
			settings.fix = 0;
			settings.$element.className = settings.$element.className.replace(disabled_reg, '').replace(engineering_reg, '');
			settings.$element.title = item.name + ' (Enforced: ' + settings.enforced + ')';
		} else {
			settings.$element.title = item.name + ' (Broken down, being fixed ' + settings.fix + '/' + fix_required;
		}
	}
};

var real_tick = function() {
	if ( !info_updated ) {
		update_info();
	}

	janitors_used = janitors;
	engineers_used = engineers;

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

	money -= janitors * janitor_cost;
	money -= engineers * engineer_cost;
	$money.innerHTML = money;
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
			durability: null,
			enforced: null,
			fix: 0,
			no_power_ticks: 0
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

$casino.onclick = function(e) {
	var $element = e.target;

	if ( $element.tagName != 'BUTTON' ) return;

	if ( !selected_item || $element._settings.item_id ) {
		if ( !$element._settings.item_id ) return;

		var item = game_items[$element._settings.item_id];
		$element._settings.durability = 1;
		$element._settings.fix = 0;
		$element._settings.enforced = item.enforced;
		$element.className = $element.className.replace(disabled_reg, '').replace(engineering_reg, '').replace(janitoring_reg, '');
		
		money -= item.cost / 2;
		update_info();
		return;
	};

	$element._settings.item_id = selected_item.id;
	$element._settings.durability = 1;
	$element._settings.enforced = selected_item.enforced;
	money -= selected_item.cost;
	$money.innerHTML = money;

	$element.className = $element.className.replace(casino_item_reg, '') + ' ( ' + selected_item.id + ' )';
	update_info();
};

$casino.oncontextmenu = function(e) {
	var $element = e.target;

	if ( $element.tagName != 'BUTTON' ) return;

	$element._settings.item_id = null;

	$element.className = $element.className.replace(casino_item_reg, '')

	return false;
};

$janitor_add.onclick = function() {
	if ( janitors < janitors_max ) {
		janitors++;
	}

	update_info();
};

$janitor_remove.onclick = function() {
	if ( janitors ) {
		janitors--;
	}

	update_info();
};

$engineer_add.onclick = function() {
	if ( engineers < engineers_max ) {
		engineers++;
	}

	update_info();
};

$engineer_remove.onclick = function() {
	if ( engineers ) {
		engineers--;
	}

	update_info();
};

// Start game
start_date = new Date();
start_ms = start_date.getTime();

$money.innerHTML = money;
$vault.innerHTML = vault;

setTimeout(tick, 1000 / ticks_per_second);

})();