var Taskspin = (function(){
	var CHECKBOX_CLASS = "checkbox";
	var CHECKBOX_CHECKED_CLASS = "checked";
	var COLLAPSE_CONTROL_CLASS = "collapseControl";
	var COLLAPSE_CONTROL_SIGN = "➤";
	var COLLAPSE_CONTROL_SIGN_COLLAPSEDCLASS = "collapsed";
	var root = "#tasks";
	var base = "#tasks ul:first";
	var $emptyTaskWithPlaceholder = $('<li><div class="' + CHECKBOX_CLASS + '" role="checkbox" aria-checked="false"></div><div class="' + COLLAPSE_CONTROL_CLASS + '">' + COLLAPSE_CONTROL_SIGN + '</div><input type="text" value="" placeholder="Start typing your first Task here" /></li>');
	var currentFocusedTask;

	var $dummy = $('<li><div class="' + CHECKBOX_CLASS + '" role="checkbox" aria-checked="false"></div><div class="' + COLLAPSE_CONTROL_CLASS + '">' + COLLAPSE_CONTROL_SIGN + '</div><input type="text" value="" /></li>');
	var $dummyUL = $('<ul><li><div class="' + CHECKBOX_CLASS + '" role="checkbox" aria-checked="false"></div><div class="' + COLLAPSE_CONTROL_CLASS + '">' + COLLAPSE_CONTROL_SIGN + '</div><input type="text" value="" /></li></ul>');
		
	var init = function(){
		
		// If a localStorage-object with the name "TASKSPIN_SAVE" exists...
		if(localStorage.getItem('TASKSPIN_SAVE'))
		{
			// ... parse the JSON-string
			var jsonObjFromLocalStorage = JSON.parse(localStorage.getItem('TASKSPIN_SAVE'));
			// If the JSON-string contains at least one element, parse and display it.
			if (jsonObjFromLocalStorage.length > 0){
				$(root).css({marginLeft: "-10000px"});
				public.setJSON(jsonObjFromLocalStorage);
				setTimeout(function(){ $(root).hide().css({marginLeft:'0'}).fadeIn();}, 200);
			}
			// Otherwise place an empty task with a placeholder on the root level
			else $(base).append($emptyTaskWithPlaceholder.clone().hideCollapseControl());
		}
		else
		{
			$(base).append($emptyTaskWithPlaceholder.clone());
		}
		
		$(root).on('keyup', 'input', processKeyUp);
		$(root).on('keydown', 'input', processKeyDown);
		$(root).on('focus', 'input', processFocus);		
		$(root).on('click', '.' + CHECKBOX_CLASS, processClickOnCheckbox);
		$(root).on('click', '.' + COLLAPSE_CONTROL_CLASS, processClickOnCollapseControl);
		$(document).keydown(processDocumentKeyDown);
		
		// Custom event handler
		$(root).on('treechange', save);
		
		return public;
	};
	
	var processDocumentKeyDown = function(e){
		
	}	
	
	var processClickOnCollapseControl = function(e)
	{
		$(e.target).parent().toggleCollapse();
		$(currentFocusedTask).focusTask();
		$(root).trigger('treechange');
	}
	
	var processClickOnCheckbox = function(e)
	{
		$(e.target).parent().toggleCheckboxes();
		$(currentFocusedTask).focusTask();
		$(root).trigger('treechange');
	}
	
	var processFocus = function(e)
	{
		currentFocusedTask = $(this).parent();
		$(root).trigger('treechange');
		e.stopPropagation();
	}
	
	var processKeyDown = function(e){
		var $task = $(this).parent();
		
		e.stopPropagation();
		
		// CMD+Backspace or ESC on Empty Task
		if (( e.keyCode == 8  && e.metaKey ) ||
			( e.keyCode == 27 && e.target.value.trim() == "" )) 
		{
			e.preventDefault();
			var taskSiblingsAndSelf = $task.siblings().andSelf();
			var taskIndex = taskSiblingsAndSelf.index($task);
			var taskDepth = $task.getDepth();
			if ((taskIndex == 0 && taskDepth == 0) ||
			    (taskIndex < taskSiblingsAndSelf.length - 1))
				$($task.getTask(1, true)).focusTask();
			else
				$($task.getTask(-1, false)).focusTask();
				
			var $tasksParent = $task.getParentTask();
			
			// If this is the last task of this level, delete the surrounding ul-tag
			if ($task.siblings().length == 0 && taskDepth != 0) $task.parent().remove();
			else $task.remove();

			// If there are no childrens on the root-level anymore, create an empty task with placeholder
			if ($(base).children().length == 0) 
			{
				// Create a clone instance of an empty Task with placeholder
				var $_emptyTaskWithPlaceholder = $emptyTaskWithPlaceholder.clone().hideCollapseControl();
				
				// Append the empty Task and focus its input field
				$(base).append($_emptyTaskWithPlaceholder);
				$_emptyTaskWithPlaceholder.focusTask();
			}
			
			if (taskDepth > 0)
				$tasksParent.find('li:first').setParentsCheckedIfAllChildrenAreChecked();
				
			if ($tasksParent.length > 0 && !$tasksParent.hasChildTask()) $tasksParent.hideCollapseControl();
				
			$(root).trigger('treechange');
		}
			
		if(e.keyCode == 9) // Tab
			e.preventDefault(); // for use on keyUp

		if(e.keyCode == 38 || e.keyCode == 40) // Up or down arrow
		{
			if(e.altKey) return;
			if (e.metaKey)
			{
				e.preventDefault();
				if($task.hasChildTask())
				{
					// If the task is expanded and CMD+Down is pressed 
					// Jump to the last child
					if(!$task.isCollapsed() && e.keyCode == 40)
					{
						$task.getChildTask(true).focusTask();
						return;
					}
					
					// If the task is collapsed and CMD+Up is pressed
					// Jump to the parent task
					else if($task.isCollapsed() && e.keyCode == 38)
					{
						$($task.getParentTask()).focusTask();
						return;
					}
					
					if (e.keyCode == 38) $task.collapse();
					else if (e.keyCode == 40) $task.expand();
				}
				else if(e.keyCode == 38)
					$($task.getParentTask()).focusTask();
			}
			else
			{
				var direction = e.keyCode == 38 ? -1 : +1;
				var sameLevelRequired = false; // var sameLevelRequired = e.altKey ? true : false;
				
				$($task.getTask(direction, sameLevelRequired)).focusTask();
				e.preventDefault();
			}
			return;
		}
		
	};
	
	var processKeyUp = function(e){
		var $task = $(this).parent();
		
		e.stopPropagation();

		if(e.keyCode == 9) // Tab
		{
			if($task.hasChildTask())
			{	
				if($task.isCollapsed())
					$task.expand();
				$task.getTask(+1).insertTaskBefore().focusTask();
				return;
			}
			
			if(e.target.value.trim() == '') { e. stopPropagation(); return; }
			else
			{
				$task.showCollapseControl();
				$(public.insertTaskAfter($task, true)).hideCollapseControl().focusTask();
			}	
			
			// Uncheck all parent tasks up to the root-level
			$task.checkboxes().uncheck();
			$task.uncheckAllParents();
		}

		if(e.keyCode == 13 && !e.altKey && !e.shiftKey) // Return without ALT and without SHIFT
		{
			if(e.target.value.trim() == '') { e.stopPropagation(); return; };
			
			$(public.insertTaskAfter($task)).hideCollapseControl().focusTask();
			
			// Uncheck all parent tasks up to the root-level
			$task.uncheckAllParents();
		}
		else if(e.keyCode == 13 && e.altKey && !e.shiftKey) // Return with ALT and without SHIFT
		{
			$task.toggleCheckboxes();
			return;
		}
		else if(e.keyCode == 13 && e.shiftKey && !e.altKey) // Return with SHIFT
		{
			public.insertTaskAfter($task.getParentTask()).focusTask();
			return;
		}
		else if(e.keyCode == 13 && e.shiftKey && e.altKey) // Return + Shift + Alt
		{
			$(base).append($dummy.clone())
			$task.getRootlevelParent().next().focusTask();
		}
		
		if((e.keyCode == 38 || e.keyCode == 40) && e.altKey)
		{
			var direction = e.keyCode == 38 ? -1 : +1;
			var $otherTask = $task.getTask(direction, true);
			if($otherTask[0] == $task[0]) return;
			if(direction < 0)
			{
				$task.insertBefore($otherTask).focusTask();
			}
			else
			{
				$task.insertAfter($otherTask).focusTask();
			}
		}
		
		$(root).trigger('treechange');
	};
	
	var save = function(evt){
		var tree = public.getJSON();
		localStorage.setItem('TASKSPIN_SAVE', JSON.stringify(tree));
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
			if(obj[i].checked) $inserted.check();
			if(obj[i].focus) $inserted.focusTask();
			
			if(obj[i].childTasks)
			{
				parseJSONObject(obj[i].childTasks, $inserted, currentDepth);
				if(obj[i].collapsed) $inserted.collapse();
			}
			else
				$inserted.hideCollapseControl();
			
			appendTasksTo = $inserted;
		}
	}
	
	var setWindowTitle = function(title){
		$('title').html(title + ' | Taskspin.');
	};
	
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
				//$new.hideCollapseControl();
			}
			else
				$new.insertAfter($task);
			
			// CSS Fix
			$new.fixWidth();
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
						"title": $currentChild.find('input:first').val().trim()
						, "checked": $currentChild.isChecked()
						, "depth": depth
					};
					
					console.log($currentChild[0] == currentFocusedTask[0], currentFocusedTask);
					if($currentChild[0] == currentFocusedTask[0])
						output[counter].focus = true;
					
					if($currentChild.hasChildTask())
					{
						output[counter].collapsed = $currentChild.isCollapsed();
						output[counter].childTasks = this.getJSON($currentChild.children('ul'), depth+1);
					}

					counter++;
				}
				
				output.length = counter;
			}
			return output;
		}
		
		, setJSON : function(JSONObj){
			$(base).remove('*');	
			parseJSONObject(JSONObj);
			//setTimeout(public.focusFirstTask, 200);
			$(root).trigger('treechange');		
		}
		
		, focusFirstTask : function(){
			return $(root).find('li:first input:first').focus();
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
				if($test.hasChildTask() && !$test.isCollapsed())
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
			if(sameLevelRequired == false && relativeLocation > 0 && this.hasChildTask() && !this.isCollapsed())
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
				if($siblings.eq(absoluteLocation).isCollapsed())
					return $siblings.eq(absoluteLocation);
				else
					return $siblings.eq(absoluteLocation).getChildTask(true);
			}
			
			// If absoluteLocation < 0 get Task of higher level
			if(!sameLevelRequired && absoluteLocation < 0 && this.getDepth() > 0)
			{
				return this.getParentTask(false);
			}
			
			// If the current Task is the last in that level get the next parent
			else if(!sameLevelRequired && absoluteLocation >= $siblings.length)
				return this.getParentTask(true);
			else if(sameLevelRequired && absoluteLocation >= $siblings.length)
				absoluteLocation = $siblings.length - 1;
			else if(absoluteLocation < 0)
				absoluteLocation = 0;
			
			return $siblings.eq(absoluteLocation);
		}
		
		, $.fn.getAbsolutePositionOnCurrentLevel = function(){
			var $siblings = this.parent().children();
			var currentLocation = $siblings.index(this);
			return currentLocation + relativeLocation;
		}
		
		, $.fn.getRootlevelParent = function()
		{
			$currentTask = this;
			for (var i = 0; i < this.getDepth(); i++)
				$currentTask = $currentTask.getParentTask(false);
			return $currentTask;
		}
		
		, $.fn.isChecked = function(){
			return this.checkbox().hasClass(CHECKBOX_CHECKED_CLASS);
		}
		
		, $.fn.check = function(){
			this.each(function(){
				var $this = $(this);
				if(!$this.isChecked()) $this.checkbox().addClass(CHECKBOX_CHECKED_CLASS);
			});
		}

		, $.fn.uncheck = function(){
			this.each(function(){
				var $this = $(this);
				if($this.isChecked()) $this.checkbox().removeClass(CHECKBOX_CHECKED_CLASS);
			});
		}
		
		, $.fn.checkbox = function(){
			var $this = $(this); // If it is no jQuery object make sure it is!
			return $this.hasClass(CHECKBOX_CLASS) ? this : this.find("." + CHECKBOX_CLASS + ":first");
		}
		
		, $.fn.checkboxes = function(){
			return this.find('.' + CHECKBOX_CLASS); // Chaining
		}

		, $.fn.uncheckAllParents = function(readjustLevel)
		{
			var $currentTask = this;
			var depth = this.getDepth() + ((readjustLevel) ? readjustLevel : 0);
			// Goes to the root level and unchecks all parent tasks
			for (var i = 0; i < depth; i++)
			{
				$currentTask = $currentTask.getParentTask(false);
				$currentTask.checkbox().uncheck();
			}
		}
		
		, $.fn.areAllChecked = function(){
			// for use of x.checkboxes.areAllChecked()
			
			// Start with 1, because 0 is the parent Task
			for(var i = 1; i < this.length; i++)
			{
				if(!$(this[i]).isChecked())
					return false;
			}
			
			return true;
		}
		
		, $.fn.setParentsCheckedIfAllChildrenAreChecked = function(){
			for(var currentParent = this.getParentTask(); currentParent.length > 0; currentParent = currentParent.getParentTask())
			{
				if(currentParent.checkboxes().areAllChecked())
					currentParent.checkbox().check();
				else
					break; // Improves efficiency, because if this parent Task is not checked the one above can't be checked either
			}
		}
		
		, $.fn.toggleCheckboxes = function()
		{
			// Tests whether the current task is "checked" or not
			if (this.isChecked())
			{
				// uncheck current Task and uncheck all child tasks too (if there are any)
				this.checkboxes().uncheck();
				this.uncheckAllParents();
			}
			else
			{
				this.checkboxes().check();
				this.setParentsCheckedIfAllChildrenAreChecked();
			}
		}
		
		, $.fn.insertTaskBefore = function(){
			return $dummy.clone().insertBefore(this).fixWidth().hideCollapseControl();
		}
		
		, $.fn.fixWidth = function(){
			this.css('width', parseInt($('#tasks').css('width')) - (30*(this.getDepth())));
			if (this.find('.collapseControl').length == 0) this.css('width', '+=16px');
			return this;
		}
		
		, $.fn.focusTask = function(){
			this.find('input:first').focus();
			return this;
		}
		
		, $.fn.showCollapseControl = function(){
			this.find('.collapseControlHidden:first').addClass('collapseControl').removeClass('collapseControlHidden').show();
			return this.fixWidth();
		}
		
		, $.fn.hideCollapseControl = function(){
			this.find('.collapseControl:first').addClass('collapseControlHidden').removeClass('collapseControl').hide();
			return this.fixWidth();
		}
		
		, $.fn.toggleCollapse = function(){
			if(this.isCollapsed())
				this.expand();
			else
				this.collapse();
		}
		
		, $.fn.isCollapsed = function(){
			return this.children('div').filter('.' + COLLAPSE_CONTROL_SIGN_COLLAPSEDCLASS + ':first').length;
		}
		
		, $.fn.collapse = function(){
			this.find('.' + COLLAPSE_CONTROL_CLASS + ':first').addClass(COLLAPSE_CONTROL_SIGN_COLLAPSEDCLASS).end().find('ul:first').fadeTo(150 , 0).slideUp(150);
			$(root).trigger('treechange');
		}
		
		, $.fn.expand = function(){
			this.find('.' + COLLAPSE_CONTROL_CLASS + ':first').removeClass(COLLAPSE_CONTROL_SIGN_COLLAPSEDCLASS).end().find('ul:first').slideDown(150).fadeTo(150, 1);
			$(root).trigger('treechange');
		}
	})(jQuery);
	
	// Init and Expose
	return init();
})();