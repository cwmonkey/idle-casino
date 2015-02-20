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
		dirty_chance: 0.005,
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
		dirty_chance: 0.005,
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

var app = {};
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
var e;
var casino_items = [];
var $casino = document.getElementById('casino');
var $items = document.getElementById('items');
var $money = document.getElementById('money');
var $power = document.getElementById('power');
var $power_total = document.getElementById('power_total');
var $vault = document.getElementById('vault');
var $prestige = document.getElementById('prestige');
var $patrons = document.getElementById('patrons');
var $pause = document.getElementById('pause');
var $main = document.getElementById('main');
var $costs = document.getElementById('costs');
var janitoring_reg = / \( state_janitoring \)/;
var janitoring_class = ' ( state_janitoring )';
var engineering_reg = / \( state_engineering \)/;
var engineering_class = ' ( state_engineering )';
var selected_reg = / \( selected \)/;
var selected_class = ' ( selected )';
var paused_reg = / \( paused \)/;
var paused_class = ' ( paused )';
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
var paused = true;
var costs = 0;

var no_power_threshold = 5;
var no_pay_threshold = 5;
var quit_threshold = 8;

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
var rent_per_square = 5;

// TODO: Put the "static" stuff elsewhere
var staff = [
	{
		singular: 'janitor',
		plural: 'janitors',
		cost: 50,
		room_type: 'janitor_closet',
		$count: null,
		$max: null,
		quit_reasons: 0,
		max: 0,
		count: 0
	},
	{
		singular: 'engineer',
		plural: 'engineers',
		cost: 180,
		room_type: 'engineer_room',
		$count: null,
		$max: null,
		quit_reasons: 0,
		max: 0,
		count: 0
	},
	{
		singular: 'waitress',
		plural: 'waitresses',
		cost: 90,
		room_type: 'changing_room',
		$count: null,
		$max: null,
		quit_reasons: 0,
		max: 0,
		count: 0
	}
];

var janitors = staff[0];
var engineers = staff[1];

var ads = [
	{
		name: 'tv',
		cost: 100,
		count: 0,
		prestige: 100,
		titleTpl: null,
		$count: null,
		$title_element: null
	},
	{
		name: 'radio',
		cost: 10,
		count: 0,
		prestige: 10,
		titleTpl: null,
		$count: null,
		$title_element: null
	},
	{
		name: 'billboard',
		cost: 5,
		count: 0,
		prestige: 5,
		titleTpl: null,
		$count: null,
		$title_element: null
	}
];

// Update variables, I guess
var update_info = function() {
	power = 0;
	prestige = 0;
	vault = base_vault;

	for ( e = 0; e < staff.length; e++ ) {
		var employee = staff[e];
		employee.max = 0;
	}

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

					for ( e = 0; e < staff.length; e++ ) {
						var employee = staff[e];
						if ( item[employee.plural] ) {
							employee.max += item[employee.plural];
						}
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

	for ( e = 0; e < staff.length; e++ ) {
		var employee = staff[e];

		if ( employee.count > employee.max ) {
			employee.count = employee.max;
		}

		employee.$max.innerHTML = employee.max;
		employee.$count.innerHTML = employee.count;

		if ( employee.singular == 'waitress' ) {
			prestige += employee.count * waitress_prestige;
		}
	}

	for ( e = 0; e < ads.length; e++ ) {
		var ad = ads[e];

		for ( var f = 1; f <= ad.count; f++ ) {
			if ( money > vault * -1 ) {
				prestige += ad.prestige;
				money -= ad.cost;
				costs += ad.cost;
			}
		}

		ad.$count.innerHTML = ad.count;
	}

	$prestige.innerHTML = prestige;
	$power.innerHTML = power;
	$power_total.innerHTML = power;
	$vault.innerHTML = vault;
	info_updated = true;
}

// Apply item attributes
var do_item = function(settings, up, down, left, right) {
	if ( !settings.item_id ) {
		return;
	}

	var item = game_items[settings.item_id];
	var patron_count = '';

	for ( e = 0; e < staff.length; e++ ) {
		var employee = staff[e];

		if ( item.type == employee.room_type ) {
			if ( item.power_usage > power && employee.count ) {
				employee.quit_reasons++;

				if ( employee.quit_reasons == quit_threshold ) {
					employee.quit_reasons = 0;
					employee.count--;
					employer.$count.innerHTML = employee.count;
				}
			}
		}
	}

	if (
		item.tick_cost
		&& ( !item.break_chance || ( item.break_chance && settings.durability ) )
		&& ( !item.power_usage || item.power_usage <= power )
	) {
		money -= item.tick_cost;
		costs += item.tick_cost;
	}

	if ( item.break_chance && settings.durability && ( !item.power_usage || item.power_usage <= power ) ) {
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

	costs = 0;
	janitors_available = janitors.count;
	engineers_available = engineers.count;

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
			money -= rent_per_square;
			costs += rent_per_square;

			if ( settings ) {
				do_item(settings, up, down, left, right);
			}
		}
	}

	for ( e = 0; e < staff.length; e++ ) {
		var employee = staff[e];

		for ( i = 0; i < employee.count; i++ ) {
			if ( money > vault * -1 ) {
				money -= employee.cost;
				costs += employee.cost;
			} else {
				employee.quit_reasons++;

				if ( employee.quit_reasons == quit_threshold ) {
					employee.quit_reasons = 0;
					employee.count--;
					employee.$count.innerHTML = employee.count;
				} else {
					costs += employee.cost;
				}
			}
		}
	}

	$money.innerHTML = money;
	$costs.innerHTML = costs;
	$patrons.innerHTML = patrons;
	info_updated = false;
};

// Make sure the correct amount of ticks fire in case of lag or something
var tick = function() {
	if ( !paused ) {
		//now_date = new Date();
		//now_ms = now_date.getTime();

		//ticks = Math.floor( (now_ms - start_ms) / (1000 / ticks_per_second) );

		//for ( i = 1; i <= ticks; i++ ) {
			real_tick();
		//}
	}

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
		$element.title = item.name + ' - ' + item.description;
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

	$element.className = $element.className.replace(casino_item_reg, '');
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

$pause.onclick = function() {
	if ( paused ) {
		$main.className = $main.className.replace(paused_reg, '');
		paused = false;
	} else {
		$main.className += paused_class;
		paused = true;
	}
};

// Employees
for ( i = 0; i < staff.length; i++ ) {
	(function() {
		var employee = staff[i];

		employee.$count = document.getElementById(employee.plural);
		employee.$max = document.getElementById(employee.plural + '_max');

		employee.count = 0;
		employee.max = 0;
		employee.quit_reasons = 0;

		// Add employee
		document.getElementById(employee.singular + '_add').onclick = function() {
			if ( employee.count < employee.max ) {
				employee.count++;
				update_info();
			}
		};

		// Fire employee
		document.getElementById(employee.singular + '_remove').onclick = function() {
			if ( employee.count ) {
				employee.count--;
				update_info();
			}
		};
	})();
}

// Ads
for ( i = 0; i < ads.length; i++ ) {
	(function() {
		var ad = ads[i];

		ad.$count = document.getElementById(ad.name + '_ads');
		ad.$title_element = document.getElementById(ad.name + '_add');
		ad.titleTpl = ad.$title_element.title;
		ad.$title_element.title = ad.titleTpl.replace('{cost}', ad.cost).replace('{prestige}', ad.prestige);

		ad.count = 0;

		// Add employee
		document.getElementById(ad.name + '_add').onclick = function() {
			ad.count++;
			update_info();
		};

		// Fire employee
		document.getElementById(ad.name + '_remove').onclick = function() {
			if ( ad.count ) {
				ad.count--;
				update_info();
			}
		};
	})();
}

// Start game
start_date = new Date();
start_ms = start_date.getTime();

$money.innerHTML = money;
$vault.innerHTML = vault;

$main.className += paused_class;

setTimeout(tick, 1000 / ticks_per_second);

})();