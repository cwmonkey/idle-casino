var game_items = {
	slot_machine: {
		id: 'slot_machine',
		name: 'Slot Machine',
		type: 'machine',
		description: 'Generates revenue from willing patrons',
		cost: 800,
		prestige: 1,
		power_usage: 1,
		break_chance: 0.01,
		enforced: 50,
		revenue: 250,
		patron_count: 1
	},
	bar: {
		id: 'bar',
		name: 'Bar',
		type: 'machine',
		description: 'Generates revenue from up to 5 willing patrons',
		cost: 2000000,
		prestige: 5,
		power_usage: 2,
		break_chance: 0.01,
		enforced: 50,
		revenue: 2500,
		patron_count: 5
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
		cost: 100000,
		power_usage: 1,
		break_chance: 0.01,
		enforced: 50,
		vault: 1000000
	},
	carpet_leftright: {
		id: 'carpet_leftright',
		name: 'Carpet - Left/Right',
		type: 'furniture',
		description: 'Doubles prestige of items above/below (does not stack)',
		cost: 50,
		dirty_chance: 0.01,
		prestige: 1,
		boost_prestige_up: 2,
		boost_prestige_down: 2
	},
	carpet_updown: {
		id: 'carpet_updown',
		name: 'Carpet - Up/Down',
		type: 'furniture',
		description: 'Doubles prestige of items left/right (does not stack)',
		cost: 50,
		dirty_chance: 0.01,
		prestige: 1,
		boost_prestige_left: 2,
		boost_prestige_right: 2
	},
	shrub: {
		id: 'shrub',
		name: 'Shrub',
		type: 'furniture',
		description: 'Adds prestige',
		cost: 100,
		dirty_chance: 0.01,
		prestige: 1
	},
	wall: {
		id: 'wall',
		name: 'Wall',
		description: 'Adds prestige',
		cost: 500,
		prestige: 1
	},
	changing_room: {
		id: 'changing_room',
		name: 'Changing Room',
		type: 'changing_room',
		description: 'Allows you to hire waitresses',
		cost: 50000,
		power_usage: 1,
		waitresses: 3
	},
	janitor_closet: {
		id: 'janitor_closet',
		name: 'Janitor\'s Closet',
		type: 'janitor_closet',
		description: 'Allows you to hire janitors',
		cost: 10000,
		power_usage: 1,
		janitors: 1
	},
	engineer_room: {
		id: 'engineer_room',
		name: 'Engineering Room',
		type: 'engineer_room',
		description: 'Allows you to hire engineers',
		cost: 50000,
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
var $power_total = document.getElementById('power_total');
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
var $waitresses = document.getElementById('waitresses');
var $waitresses_max = document.getElementById('waitresses_max');
var $waitress_add = document.getElementById('waitress_add');
var $waitress_remove = document.getElementById('waitress_remove');
var $patrons = document.getElementById('patrons');
var janitoring_reg = / \( state_janitoring \)/;
var janitoring_class = ' ( state_janitoring )';
var engineering_reg = / \( state_engineering \)/;
var engineering_class = ' ( state_engineering )';
var selected_reg = / \( selected \)/;
var selected_class = ' ( selected )';
var broken_reg = / \( state_broken \)/;
var broken_class = ' ( state_broken )';
var dirty_reg = / \( state_dirty \)/;
var dirty_class = ' ( state_dirty )';
var state_reg = / \( state_[a-z_]+ \)/;
var selected_item = null;
var casino_item_reg = / \( [a-z_]+ \)/g;
var info_updated = false;
var base_vault = 1000000;
var janitors_available;
var engineers_available;
var fix_required = 5;
var cleaning_required = 5;

var no_power_threshold = 5;
var no_pay_threshold = 5;
var quit_threshold = 8;
var janitor_quit_reasons = 0;
var engineer_quit_reasons = 0;
var waitress_quit_reasons = 0;

var patrons = 0;
var patrons_available;
var prestige_for_patron = 10;
var patron_chance = 0.1;
var waitress_prestige = 5;
var drag_place = true;
var drag_remove = true;

var money = 1000000;
var power = 0;
var prestige = 0;
var vault = base_vault;

var janitors_max = 0;
var janitors = 0;
var janitor_cost = 50;
var engineers_max = 0;
var engineers = 0;
var engineer_cost = 180;
var waitresses_max = 0;
var waitresses = 0;
var waitress_cost = 90;

// Update variables, I guess
var update_info = function() {
	power = 0;
	prestige = 0;
	vault = base_vault;
	janitors_max = 0;
	engineers_max = 0;
	waitresses_max = 0;

	for ( i = 0; i < rows; i++ ) {
		for ( j = 0; j < columns; j++ ) {
			var settings = casino_items[i][j];
			var up = ( i ) ? casino_items[i - 1][j] : null;
			var down = ( i < rows - 1 ) ? casino_items[i + 1][j] : null;
			var left = ( j ) ? casino_items[i][j - 1] : null;
			var right = ( j < columns - 1 ) ? casino_items[i][j + 1] : null;

			if ( settings && settings.item_id ) {
				var item = game_items[settings.item_id];

				if ( item.patron_count ) {
					settings.patron_count = item.patron_count;
				}

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

					if ( item.waitresses ) {
						waitresses_max += item.waitresses;
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

				if ( item.dirty_chance && !settings.clean && item.prestige ) {
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

	if ( waitresses > waitresses_max ) {
		waitresses = waitresses_max;
	}

	prestige += waitresses * waitress_prestige;

	$prestige.innerHTML = prestige;
	$power.innerHTML = power;
	$power_total.innerHTML = power;
	$vault.innerHTML = vault;
	$janitors_max.innerHTML = janitors_max;
	$janitors.innerHTML = janitors;
	$engineers_max.innerHTML = engineers_max;
	$engineers.innerHTML = engineers;
	$waitresses_max.innerHTML = waitresses_max;
	$waitresses.innerHTML = waitresses;
	info_updated = true;
}

// Apply item attributes
var do_item = function(settings, up, down, left, right) {
	if ( !settings.item_id ) {
		return;
	}

	var item = game_items[settings.item_id];
	var patron_count = '';

	if ( item.type == 'janitor_closet' ) {
		if ( item.power_usage > power && janitors ) {
			janitor_quit_reasons++;
			if ( janitor_quit_reasons == quit_threshold ) {
				janitor_quit_reasons = 0;
				janitors--;
				$janitors.innerHTML = janitors;
			}
		}
	} else if ( item.type == 'engineer_room' ) {
		if ( item.power_usage > power && engineers ) {
			engineer_quit_reasons++;
			if ( engineer_quit_reasons == quit_threshold ) {
				engineer_quit_reasons = 0;
				engineers--;
				$engineers.innerHTML = engineers;
			}
		}
	} else if ( item.type == 'changing_room' ) {
		if ( item.power_usage > power && waitresses ) {
			waitress_quit_reasons++;
			if ( waitress_quit_reasons == quit_threshold ) {
				waitress_quit_reasons = 0;
				waitresses--;
				$waitresses.innerHTML = waitresses;
			}
		}
	} else if ( item.break_chance && settings.durability && ( !item.power_usage || item.power_usage <= power ) ) {
		if ( item.power_usage ) {
			power -= item.power_usage;
			$power.innerHTML = power;
		}

		if ( settings.patron_count && patrons_available ) {
			while ( settings.patron_count && patrons_available ) {
				patrons_available--;
				settings.patron_count--;

				var revenue = item.revenue || 0;

				if ( revenue ) {
					// If the vault is full, deduct 20% from revenue
					if ( money >= vault ) {
						revenue = Math.floor(revenue * .8);
					}
				}

				money += revenue;
			}

			patron_count = item.patron_count - settings.patron_count;
			$money.innerHTML = money;

			var title = item.name;

			if ( settings.enforced ) {
				settings.enforced--;
				title += ' (Enforced: ' + settings.enforced + ')';
			} else if ( item.break_chance && Math.random() < item.break_chance ) {
				settings.durability = 0;
				settings.$element.className += broken_class;
				title += ' (Broken down)';
			} else if ( item.break_chance ) {
				title += ' (Breakdown Chance: ' + item.break_chance + ')';
			}

			if ( item.dirty_chance && Math.random() < item.dirty_chance ) {
				settings.clean = 0;
				settings.$element.className += dirty_class;
				title += ' (Dirty)';
			} else if ( item.dirty_chance ) {
				title += ' (Dirty Chance: ' + item.dirty_chance + ')';
			}

			settings.$element.title = title;
		}
	} else if ( item.type == 'machine' && !settings.durability && engineers_available ) {
		engineers_available--;
		settings.fix++;

		if ( settings.fix == 1 ) {
			settings.$element.className += engineering_class;
		} else if ( settings.fix == fix_required ) {
			settings.durability = 1;
			settings.enforced = item.enforced;
			settings.fix = 0;
			settings.patron_count = item.patron_count;
			settings.$element.className = settings.$element.className.replace(broken_reg, '').replace(engineering_reg, '');
			settings.$element.title = item.name + ' (Enforced: ' + settings.enforced + ')';
		} else {
			settings.$element.title = item.name + ' (Broken down, being fixed ' + settings.fix + '/' + fix_required;
		}
	}

	if ( item.dirty_chance && !settings.clean && janitors_available ) {
		janitors_available--;
		settings.cleaning++;

		if ( settings.cleaning == 1 ) {
			settings.$element.className += janitoring_class;
		} else if ( settings.cleaning == cleaning_required ) {
			settings.clean = 1;
			settings.cleaning = 0;
			settings.$element.className = settings.$element.className.replace(dirty_reg, '').replace(janitoring_reg, '');
			settings.$element.title = item.name;
		} else {
			settings.$element.title = item.name + ' (Being cleaned ' + settings.cleaning + '/' + cleaning_required;
		}
	} else if ( item.dirty_chance && settings.clean && Math.random() < item.dirty_chance ) {
		settings.clean = 0;
		settings.$element.className += dirty_class;
		title += ' (Dirty)';
	}

	if ( item.patron_count ) {
		settings.$element.innerHTML = patron_count;
	}
};

var real_tick = function() {
	if ( !info_updated ) {
		update_info();
	}

	janitors_available = janitors;
	engineers_available = engineers;

	if ( prestige > 0 ) {
		patrons = Math.ceil(prestige / prestige_for_patron);
		patrons += Math.floor((Math.random() * Math.floor(prestige / prestige_for_patron)) + 1);
	}

	patrons_available = patrons;

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

	for ( i = 0; i < janitors; i++ ) {
		if ( money > vault * -1 ) {
			money -= janitor_cost;
		} else {
			janitor_quit_reasons++;

			if ( janitor_quit_reasons == quit_threshold ) {
				janitor_quit_reasons = 0;
				janitors--;
				$janitors.innerHTML = janitors;
			}
		}
	}

	for ( i = 0; i < engineers; i++ ) {
		if ( money > vault * -1 ) {
			money -= engineer_cost;
		} else {
			engineer_quit_reasons++;

			if ( engineer_quit_reasons == quit_threshold ) {
				engineer_quit_reasons = 0;
				engineers--;
				$engineers.innerHTML = engineers;
			}
		}
	}

	for ( i = 0; i < waitresses; i++ ) {
		if ( money > vault * -1 ) {
			money -= waitress_cost;
		} else {
			waitress_quit_reasons++;

			if ( waitress_quit_reasons == quit_threshold ) {
				waitress_quit_reasons = 0;
				waitresses--;
				$waitresses.innerHTML = waitresses;
			}
		}
	}

	$money.innerHTML = money;
	$patrons.innerHTML = patrons;
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

var set_defaults = function($element) {
	$element._settings.durability = 1;
	$element._settings.clean = 1;
	$element._settings.enforced = null;
	$element._settings.fix = 0;
	$element._settings.cleaning = 0;
	$element._settings.no_power_ticks = 0;
	$element._settings.patron_count = 0;
};

// Make rows
for ( i = 0; i < rows; i++ ) {
	var row = [];
	var $row = document.createElement('div');

	for ( j = 0; j < columns; j++ ) {
		var $element = document.createElement('button');
		var settings = {
			$element: $element,
			item_id: null,
			row: i,
			column: j
		};

		$element.className = 'empty';
		$element._settings = settings;

		set_defaults($element);

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

var left_mousedown = false;
var right_mousedown = false;

var place = function($element) {
	if ( $element.tagName != 'BUTTON' ) return;

	if ( money < vault * -1 ) return;

	if ( !selected_item || $element._settings.item_id ) {
		if ( !$element._settings.item_id ) return;

		// TODO make cleaning cheaper
		if ( ($element._settings.break_chance && !$element._settings.durability) || ($element._settings.dirty_chance && !$element._settings.dirty) ) {
			var item = game_items[$element._settings.item_id];
			set_defaults($element);
			$element._settings.patron_count = item.patron_count;
			$element._settings.enforced = item.enforced;
			$element.className = $element.className.replace(state_reg, '');
			
			money -= item.cost / 2;
			update_info();
		}

		return;
	};

	if ( $element._settings.item_id ) return;

	set_defaults($element);
	$element._settings.item_id = selected_item.id;
	$element._settings.patron_count = selected_item.patron_count;
	$element._settings.enforced = selected_item.enforced;
	money -= selected_item.cost;
	$money.innerHTML = money;

	$element.className = $element.className.replace(casino_item_reg, '') + ' ( ' + selected_item.id + ' )';
	update_info();
};

var remove = function($element) {
	if ( $element.tagName != 'BUTTON' ) return;

	$element._settings.item_id = null;

	$element.className = $element.className.replace(casino_item_reg, '')
};

$casino.onmousedown = function(e) {
	var $element = e.target;

	if ( left_mousedown || right_mousedown ) {
		return;
	}

	if ( event.which == 3 ) {
		if ( drag_remove ) {
			right_mousedown = true;
		}

		remove($element);
	} else {
		if ( drag_place ) {
			left_mousedown = true;
		}

		place($element);
	}
};

$casino.onmousemove = function(e) {
	if ( left_mousedown ) {
		var $element = e.target;

		place($element);
	} else if ( right_mousedown ) {
		var $element = e.target;

		remove($element);
	}
};

document.body.onmouseup = function() {
	left_mousedown = right_mousedown = false;
};

document.body.onmouseleave = function() {
	left_mousedown = right_mousedown = false;
};

$casino.oncontextmenu = function(e) {
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

$waitress_add.onclick = function() {
	if ( waitresses < waitresses_max ) {
		waitresses++;
	}

	update_info();
};

$waitress_remove.onclick = function() {
	if ( waitresses ) {
		waitresses--;
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