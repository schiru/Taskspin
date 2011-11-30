var Taskspin = (function(){
	var CHECKBOX_CLASS = "checkbox";
	var CHECKBOX_CHECKED_CLASS = "checked";
	var root = "#tasks";
	var base = "#tasks ul:first";
	var $emptyTaskWithPlaceholder = $('<li><div class="' + CHECKBOX_CLASS + '" role="checkbox" aria-checked="false"></div><input type="text" value="" placeholder="Start typing your first Task here" /></li>');

	var $dummy = $('<li><div class="' + CHECKBOX_CLASS + '" role="checkbox" aria-checked="false"></div><input type="text" value="" /></li>');
	var $dummyUL = $('<ul><li><div class="' + CHECKBOX_CLASS + '" role="checkbox" aria-checked="false"></div><input type="text" value="" /></li></ul>');
		
	var init = function(){
		// If a localStorage-object with the name "TASKSPIN_SAVE" exists...
		if(localStorage.getItem('TASKSPIN_SAVE'))
		{
			// ... parse the JSON-string
			var jsonObjFromLocalStorage = JSON.parse(localStorage.getItem('TASKSPIN_SAVE'));
			// If the JSON-string contains at least one element, parse and display it.
			if (jsonObjFromLocalStorage.length > 0) public.setJSON(jsonObjFromLocalStorage);
			// Otherwise place an empty task with a placeholder on the root level
			else $(base).append($emptyTaskWithPlaceholder.clone());
		}
		else
		{
			$(base).append($emptyTaskWithPlaceholder.clone());
		}
		
		// Focuses the first task
		$(base).find('li:first input:first').focus();
			
		$(root).on('keyup', 'input', processKeyUp);
		$(root).on('keydown', 'input', processKeyDown);
		$(root).on('click', '.' + CHECKBOX_CLASS, processClickOnCheckbox);
		
		// Custom event handler
		$(root).on('treechange', save);
			
		return public;
	};
	
	var processClickOnCheckbox = function(e)
	{
		$(e.target).parent().toggleCheckboxes();
		$(root).trigger('treechange');
	}
	
	var processKeyDown = function(e){
		var $task = $(this).parent();
		
		// CMD+Return or ESC+Empty Task
		if (( e.keyCode == 8  && e.metaKey ) ||
			( e.keyCode == 27 && e.target.value.trim() == "" )) 
		{
			e.preventDefault();
			e.stopPropagation();
			$('input:first', $task.getTask(-1, true)).focus();
			
			// If this is the last task of this level, delete the surrounding ul-tags
			if ($task.siblings().length == 0 && $task.getDepth() != 0) $task.parent().remove();
			// remove the current task
			$task.remove();
			// If there are no childrens on the root-level anymore, create an empty task with placeholder
			if ($(base).children().length == 0) 
			{
				// Create a clone instance of an empty Task with placeholder
				var $_emptyTaskWithPlaceholder = $emptyTaskWithPlaceholder.clone();
				
				// Append the empty Task and focus its input field
				$(base).append($_emptyTaskWithPlaceholder);
				$('input:first', $_emptyTaskWithPlaceholder).focus();
			}
				
			$(root).trigger('treechange');
		}
			
		if(e.keyCode == 9) // Tab
			e.preventDefault(); // for use on keyUp

		if(e.keyCode == 38 || e.keyCode == 40) // Up or down arrow
		{
			var direction = e.keyCode == 38 ? -1 : +1;
			var sameLevelRequired = e.altKey ? true : false;
			$('input:first', $task.getTask(direction, sameLevelRequired)).focus();
			e.stopPropagation();
			e.preventDefault();
			return;
		}
	};
	
	var processKeyUp = function(e){
		var $task = $(this).parent();

		if(e.keyCode == 9) // Tab
		{
			if($task.hasChildTask())
			{	
				$('input:first', $task.getTask(+1, false)).focus();
				return;
			}	
			else if(e.target.value.trim() == '') { e. stopPropagation(); return; };
			
			$(public.insertTaskAfter($task, true)).find('input:first').focus();
			
			// Uncheck all parent tasks up to the root-level
			$task.find('.checkbox').removeClass(CHECKBOX_CHECKED_CLASS);
			$task.uncheckAllParents();
			
			e.stopPropagation();
		}

		if(e.keyCode == 13 && !e.altKey) // Return without ALT
		{
			if(e.target.value.trim() == '') { e.stopPropagation(); return; };
			
			$(public.insertTaskAfter($task)).find('input:first').focus();
			e.stopPropagation();
			
			// Uncheck all parent tasks up to the root-level
			public.uncheckAllParents($task);
		}
		else if(e.keyCode == 13 && e.altKey) // Return with ALT
		{
			$task.toggleCheckboxes();
		}
		
		$(root).trigger('treechange');
	};
	
	var save = function(evt){
		var tree = JSON.stringify(public.getJSON());
		localStorage.setItem('TASKSPIN_SAVE', tree);
	};
	
	var parseJSONObject = function(obj, appendTasksTo, currentDepth){
		var currentDepth = currentDepth ? currentDepth : -1;
		var appendTasksTo = appendTasksTo ? appendTasksTo : $(root);
		for(var i = 0; i < obj.length; i++)
		{
			var increaseDepth = obj[i].depth > currentDepth ? true : false;
			currentDepth = obj[i].depth;
							
			// Insert Task
			var $inserted = public.insertTaskAfter(appendTasksTo, increaseDepth);
			
			// Add values and check checkboxes if needed
			$inserted.find('input:first').val(obj[i].title);
			if(obj[i].checked) $inserted.toggleCheckboxes();
			
			if(obj[i].childTasks)
				parseJSONObject(obj[i].childTasks, $inserted, currentDepth);
			
			appendTasksTo = $inserted;
		}
	}
	
	/*************************************************************
		PUBLIC FUNCTIONS
	*/
	var public = {
		insertTaskAfter : function($task, increaseDepth){
			var $new = increaseDepth ? $dummyUL.clone() : $dummy.clone();
			
			if(increaseDepth)
			{
				$task.append($new);
				$new = $new.find('li');
			}
			else
				$new.insertAfter($task);
			
			// CSS Fix
			$new.css('width', '-=' + (30*($new.getDepth())));
			return $new;
		}
				
		, getJSON : function($tasks, depth){
			$tasks = $tasks ? $tasks : $(base);
			depth = depth ? depth : 0;
			var output = {};
			var $children = $tasks.children();
			for(var i = 0, counter = 0; i < $children.length; i++)
			{
				$currentChild = $children.eq(i);
	
				var inputVal = $currentChild.find('input:first').val().trim();
				if(inputVal != "")
				{
					output[counter] = {
						"title": $currentChild.find('input:first').val()
						, "checked": $currentChild.isChecked()
						, "depth": depth
					};
					
					if($currentChild.hasChildTask())
						output[counter].childTasks = this.getJSON($currentChild.children('ul'), depth+1);

					counter++;
				}
				
				output.length = counter;
			}
			return output;
		}
		
		, setJSON : function(JSONObj){
			$(base).remove('*');	
			parseJSONObject(JSONObj);
			$(root).trigger('treechange');		
		}
		
	};
	
	/**************************************************
	 * Object Functions
	 */
	(function($)
	{
		$.fn.getDepth = function()
		{
			return this.parents('li').length
		}
		
		, $.fn.getParentTask = function(getNext){
			var $test = this.parentsUntil(root);
			if(getNext) 
				var $next = $test.next();
			
			// Return an empty array, like jQuery does.
			if($test.length <= 1)
				return []; // Li has just one parent (the surrounding UL) but no parent Li
			
			if(getNext)
			{
				var $next = $test.eq(1).next();
				return $next.length ? $next : $test.getParentTask(true);
			}
			else
				return $test.eq(1); // Return the Li at index 1, index 0 is the UL
		}
		
		, $.fn.hasChildTask = function(){
			return this.find('ul li').length ? true : false;
		}
		
		, $.fn.getChildTask = function(getLast){
			if(getLast)
			{
				var $test = this.children('ul').children('li:last');
				if($test.hasChildTask())
					return $test.getChildTask(true);
				else
					return $test;
			}
			else
				return this.find('ul li:first');
		}
		
		, $.fn.getTask = function(relativeLocation, sameLevelRequired){
			sameLevelRequired = sameLevelRequired ? sameLevelRequired : false;
		
			// Try to get tasks by the order they are visible, no matter if they
			// are in the same level
			if(sameLevelRequired == false && relativeLocation > 0 && this.hasChildTask())
			{
				return this.getChildTask();
			}
			
			var $siblings = this.parent().children();
			
			// In current level
			var currentLocation = $siblings.index(this);
			var absoluteLocation = currentLocation + relativeLocation;

			// If the previous task has a child task and the current one is not the first one 
			// -> return the childtask of the previous one
			if(sameLevelRequired == false && relativeLocation < 0 && absoluteLocation >= 0 && $siblings.eq(absoluteLocation).hasChildTask())
			{
				return $siblings.eq(absoluteLocation).getChildTask(true);
			}
			
			// If absoluteLocation < 0 get Task of higher level
			if(!sameLevelRequired && absoluteLocation < 0 && this.getDepth() > 0)
			{
				return this.getParentTask(false);
			}
			else if (!sameLevelRequired && absoluteLocation < 0 && this.getDepth() == 0)
			{
				return this.getTask(1);
			}
			
			// If the current Task is the last in that level get the next parent
			else if(!sameLevelRequired && absoluteLocation >= $siblings.length)
				return this.getParentTask(true);
			else if(sameLevelRequired && absoluteLocation >= $siblings.length)
				absoluteLocation = 0;
			
			return $siblings.eq(absoluteLocation);
		}
		
		, $.fn.isChecked = function(){
			return this.find('.checkbox:first').hasClass(CHECKBOX_CHECKED_CLASS);
		}
		
		, $.fn.uncheckAllParents = function(readjustLevel)
		{
			var $currentTask = this;
			var depth = this.getDepth() + ((readjustLevel) ? readjustLevel : 0);
			// Goes to the root level and unchecks all parent tasks
			for (var i = 0; i < depth; i++)
			{
				$currentTask = $currentTask.getParentTask(false);
				$currentTask.find('.checkbox:first').removeClass(CHECKBOX_CHECKED_CLASS);
			}
		}
		
		, $.fn.toggleCheckboxes = function()
		{
			// Tests whether the current task is "checked" or not
			if (this.isChecked())
			{
				// uncheck current Task and uncheck all child tasks too (if there are any)
				this.find('.checkbox').removeClass(CHECKBOX_CHECKED_CLASS);
				this.uncheckAllParents();
			}
			else
			{
				this.find('.checkbox').addClass(CHECKBOX_CHECKED_CLASS);
				// TO-DO: if all siblings are checked, check the parent task
				//        if all siblings from the parent task are checked
				//        check the parent's parent, and so on...
			}
		}
	})(jQuery);
	
	// Init and Expose
	return init();
})();