var Taskspin = (function(){
	var root = "#tasks";
	var base = "#tasks ul:first";	
	var $dummy = $('<li><div class="checkbox" role="checkbox" aria-checked="false"></div><input type="text" value="" /></li>');
	var $dummyUL = $('<ul><li><div class="checkbox" role="checkbox" aria-checked="false"></div><input type="text" value="" /></li></ul>');
		
	var init = function(){
		if(localStorage.getItem('TASKSPIN_SAVE'))
			public.setJSON(JSON.parse(localStorage.getItem('TASKSPIN_SAVE')));
		else
			public.fixWidth($('#tasks ul li:first'), 0);
			
		$(root).on('keyup', 'input', processKeyUp);
		$(root).on('keydown', 'input', processKeyDown);
		
		// Custom event handler
		$(root).on('treechange', save);
			
		return public;
	};
	
	var processKeyDown = function(e){
		var $task = $(this).parent();
//		console.log(e);
		
		if(
			( e.keyCode == 8  && e.metaKey ) ||
			( e.keyCode == 27 && e.target.value.trim() == "" ) 
		) // CMD+Return or ESC+Empty Task
		{
			e.preventDefault();
			e.stopPropagation();
			$('input:first', public.getTask($task, -1)).focus();
						
			// If the last task of the level is being removed and this is not the last task of the root level
			// -> Remove the surrounding UL-Tag too
			// 2 nested if's are needed here!
			if($task.siblings().length == 0)
			{
				if(public.getDepth($task) != 0)
					$task.parent().remove();
			}			
			else
				$task.remove();
				
			$(root).trigger('treechange');
		}
			
		if(e.keyCode == 9) // Tab
			e.preventDefault(); // for use on keyUp

		if(e.keyCode == 38 || e.keyCode == 40) // Up or down arrow
		{
			var direction = e.keyCode == 38 ? -1 : +1;
			var sameLevelRequired = e.altKey ? true : false;
			$('input:first', public.getTask($task, direction, sameLevelRequired)).focus();
			e.stopPropagation();
			e.preventDefault();
			return;
			
			// TODO: Don't save emtpy tasks
			// TODO: Checkboxes. CHECK. BOXES. implement!
			// TODO: Collapseable levels
			// TODO: Shift-Enter -> add task at parent level
			// BUG: Tab press when nothing is focused + first task not empty	
			// BUG: When removing the last task of an UL the UL stays ->implement UL removal if last Task in level 
			// BUG: User could delete all tasks

		}
	};
	
	var processKeyUp = function(e){
		var $task = $(this).parent();

		if(e.keyCode == 9) // Tab
		{
			if(public.hasChildTask($task))
			{	
				$('input:first', public.getTask($task, +1, false)).focus();
				return;
			}	
			else if(e.target.value.trim() == '') { e. stopPropagation(); return; };
			
			$(public.insertTaskAfter($task, true)).find('input:first').focus();
			e.stopPropagation();
		}

		if(e.keyCode == 13) // Return
		{
			if(e.target.value.trim() == '') { e.stopPropagation(); return; };
			
			$(public.insertTaskAfter($task)).find('input:first').focus();
			e.stopPropagation();
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
			
			// Add values
			$inserted.find('input:first').val(obj[i].title)
			
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
			$new.css('width', '-=' + (30*this.getDepth($new)));
			return $new;
		}
		
		, getParentTask : function($obj, getNext){
			var $test = $obj.parentsUntil(root);
			if(getNext) 
				var $next = $test.next();
			
			// Return an empty array, like jQuery does.
			if($test.length <= 1)
				return []; // Li has just one parent (the surrounding UL) but no parent Li
			
			if(getNext)
			{
				var $next = $test.eq(1).next();
				return $next.length ? $next : this.getParentTask($test, true);
			}
			else
				return $test.eq(1); // Return the Li at index 1, index 0 is the UL
		}
		
		, hasChildTask : function($obj){
			return $obj.find('ul li').length ? true : false;
		}
		
		, getChildTask : function($obj, getLast){
			if(getLast)
			{
				var $test = $obj.children('ul').children('li:last');
				if(this.hasChildTask($test))
					return this.getChildTask($test, true);
				else
					return $test;
			}
			else
				return $obj.find('ul li:first');
		}
		
		, getTask : function($relationLi, relativeLocation, sameLevelRequired){
			sameLevelRequired = sameLevelRequired ? sameLevelRequired : false;
		
			// Try to get tasks by the order they are visible, no matter if they
			// are in the same level
			if(sameLevelRequired == false && relativeLocation > 0 && this.hasChildTask($relationLi))
			{
				return this.getChildTask($relationLi);
			}
			
			var $siblings = $relationLi.parent().children();
			
			// In current level
			var currentLocation = $siblings.index($relationLi);
			var absoluteLocation = currentLocation + relativeLocation;

			// If the previous task has a child task and the current one is not the first one 
			// -> return the childtask of the previous one
			if(sameLevelRequired == false && relativeLocation < 0 && absoluteLocation >= 0 && this.hasChildTask($siblings.eq(absoluteLocation)))
			{
				return this.getChildTask($siblings.eq(absoluteLocation), true);
			}
			
			// If absoluteLocation < 0 get Task of higher level
			if(!sameLevelRequired && absoluteLocation < 0)
			{
				return this.getParentTask($relationLi, false);
			}
			
			// If the current Task is the last in that level get the next parent
			else if(!sameLevelRequired && absoluteLocation >= $siblings.length)
				return this.getParentTask($relationLi, true);
			else if(sameLevelRequired && absoluteLocation >= $siblings.length)
				absoluteLocation = 0;
			
			return $siblings.eq(absoluteLocation);
		}
	
		, fixWidth : function($obj, depth){
			$obj.css('width', '-=' + (30*depth) + 'px');
			
			// If there is a children process it
			$children = $obj.children().find('li');
			if($children.length > 0)
				this.fixWidth($($children[0]), depth+1);
				
			$next = $obj.next();
			if($next.length > 0)
				this.fixWidth($($next[0]), depth);
		}
		
		, getDepth : function($obj){
			return $obj.parents('li').length;
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
						, "depth": depth
					};
					
					if(this.hasChildTask($currentChild))
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
	
	// Init and Expose
	return init();
})();