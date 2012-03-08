/**
 * @author don
 */
/*history:  author="dvawter"  email="dvawter@centerstonetech.com" date="2/17/2012" role="Developer" type="Create">
	Ticket:  ITB-1461	
plugin for doing progressive filtering as users type into a field
*/
/*
 * Options to be passed in on initialization
				attribute:"value"          the value we are using for the search
											In most cases we leave this at value
											but if for example our query uses a key 
											such as dealer_id but we want to search
											on CompanyName we would use companyname
											as the attribute
				dataclass:"jprogressive"	You can change this so that if you 
											are searching on multiple fields
											the class is unique for that instance
				startsWith:true				Can be true|false|contains
				waitDelay:1000,				Time in msec we wait for the user to
											stop typing before we search
				maxLimit:25,				Maximum number of results to display
				messageDiv:"message1"		Thid id of the div where we display messages
				caseSensitive:false			true|false
				minChars:0					Minimum number of characters the user must
											provide before we start searching
				fetchAtMin:false			If your page already has all the results(hidden)
											set this to false. If using ajax to fetch then set it to true
				fetchFunction:function(){   The function which makes the ajax call
				  alert("Why is this running");
				}			
				dataRetrieved:false       	You don't set this, It is set after your ajax
											call returns
				fetchedLength:0				You don't set this. It is used to determine whether
											we need to send additonal ajax calls as the user types
 USAGE
     To initialize
     $(selector).jprogressive(options) where options is a struct of the above options
     
     To unbind the progessive search
     $(selector).jprogressive("destroy")
     
     To redisplay the results using a different criteria( for instance your inital results displayed
     only results that started with xxx but now you want to display results that contain xxx
     This will only work if your original ajax call used contains
     $(selector).jprogressive({redisplay:<true|false|contains>})
     
     To inform the plugin you have successfully retrieved data (and hence it can display it)
     $(selector).jprogressive("dataRetrieved)
     
     To clear a message:
     $(selector).jprogressive("ClearMessage");
     To set a message:
     $(selector).jprogressive({setMessage:<the message>});
     
     Note that in some cases you provide a struct as the argument
     and in others you provide just a string. The string is provided
     when you are not providing additional paramaters (like destory, clearMessage, dataRetrieved)
 
 */

(function($){
	$.fn.extend({
  		jprogressive:function(_options){
  				var options={}
				var config={
				attribute:"value",
				dataclass:"jprogressive",
				startsWith:true,
				waitDelay:1000,
				maxLimit:25,
				messageDiv:"message1",
				caseSensitive:false,
				minChars:0,
				fetchAtMin:false,
				fetchFunction:function(){alert("Why is this running");},
				dataRetrieved:false,
				fetchedLength:0};
			
			//The guts of the plugin where we determine what we show
			var clearTimer=function(me){
				//user rapidly types a sequence we do not
					//start filtering until he pauses
					//kill existing timers
					
					if (typeof(me.data("mytimer")) == 'number') {
						window.clearTimeout(me.data("mytimer"));
					}
					
					
			}
			var fireTimer=function(me){
				clearTimer(me);
					//need a closure to set timeouts with parameters
					me.data("mytimer",window.setTimeout(function() { 
					filterTheList(me);
					}, options.waitDelay));
			}
			var displayTheFilteredList=function(me){
				var ct=0;
				$("#"+options.messageDiv).html("");
				//alert(options.attribute+" "+ options.startsWith);
				$("."+options.dataclass).hide().filter(function(){
						var ok=false;
						var v =$(this).attr(options.attribute);
						testVal=me.val();
						if (options.startsWith==true||options.startsWith=='startsWith'||options.startsWith=='true') {		
							//looking for elements starting with sequence
							if (options.caseSensitive) {
								if (v.indexOf(testVal) == 0) {
									ok = true;
									ct++;
								}
							}else{
								if (v.toLowerCase().indexOf(testVal.toLowerCase()) == 0) {
									ok = true;
									ct++;
								}
							}
						}
						else if (options.startsWith==false ||options.startsWith=='contains'||options.startsWith=='false') {
							//looking for elements containing the sequence
							if (options.caseSensitive) {
								if (v.indexOf(testVal) >= 0) {
									ok = true;
									ct++;
								}
							}else{
								if (v.toLowerCase().indexOf(testVal.toLowerCase()) >= 0) {
									ok = true;
									ct++;
								}
							}
						}
						else {
							//looking for containing the sequence as a word
							if (options.caseSensitive) {
								var reg = new RegExp("\\s" + testVal + "(\\s|[!.?])","");
								ok = reg.test(" " + v + " "); //add spaces at end so starting and ending words match
								if (ok) {
									ct++;
								}
							}
							else {
								var reg = new RegExp("\\s" + testVal + "(\\s|[!.?])","i");
								ok = reg.test(" " + v + " ");
								if (ok) {
									ct++;
								}
							}
						}
						return ok && ct<=options.maxLimit;
					}).show();
					if(ct>=options.maxLimit){
						$("#"+options.messageDiv).html("<strong>Too many results("+ct+"). The top </strong>"+options.maxLimit +" <strong>are shown.</strong>");
					}else if(ct==0){
						$("#"+options.messageDiv).html("<strong>No matching results found.</strong>");
					}else{
						$("#"+options.messageDiv).html(ct+" <strong>results found.</strong>");
					}
			}
			var filterTheList=function(me){
				//alert(dumpObject(options,0,false));
				options=me.data("jprogressiveoptions");
				if(me.val().length<options.fetchedLength && options.fetchAtMin && options.dataRetrieved){
							clearTimer(me);
							$("."+options.dataclass).remove();
							options.dataRetrieved=false;
							me.data("jprogressiveoptions",options);
				}
				if(me.val().length>=options.minChars && options.fetchAtMin && !options.dataRetrieved){
							clearTimer(me);
							options.fetchedLength=me.val().length;
							me.data("jprogressiveoptions",options);
							options.fetchFunction(me,me.val());
					return;
					
				}
				
				//me.css("cursor","wait");
				if (me.val() != "" && (me.val().length>=options.minChars && options.dataRetrieved) ){ //don't do anything if nothing entered yet
					//$("#"+options.messageDiv).html("");
					$("." + options.dataclass).hide(); //hide everything and then show matches
					//alert(options.startsWith);
					//if the filter returns true we show the element
					displayTheFilteredList(me);
				}
				me.css("cursor","auto");
			}  //end filterTheList function
			return this.each(function(){
				//unbind the keyup event if we are done
				if(_options=="destroy"){
					$(this).unbind("keyup");
					$(this).data("jprogressiveoptions",{});
					return;
				}else if (_options=="dataRetrieved"){
					options=$(this).data("jprogressiveoptions");
						options.dataRetrieved=true;
						$(this).data("jprogressiveoptions",options);
					fireTimer($(this));
				}
				else if (_options=="clearMessage"){
					options=$(this).data("jprogressiveoptions");
					$("#"+options.messageDiv).html("");
					
				}
				else if (typeof(_options.setMessage) != "undefined") {
				
					options = $(this).data("jprogressiveoptions");
					$("#" + options.messageDiv).html("");
					$("#" + options.messageDiv).append(_options.setMessage);
					
					
				}
				else 
					if ((typeof(_options.redisplay) != "undefined")) {
						//alert(_options.redisplay);
						if (typeof(_options.redisplay) == 'string') {
							_options.redisplay = _options.redisplay.toLowerCase();
							_options.redisplay = _options.redisplay.replace(/\s/g, '');
							if (_options.redisplay == '<strong>startswith</strong>') {
								_options.redisplay = true;
							}
							else {
								_options.redisplay = false;
							}
							options = $(this).data("jprogressiveoptions");
						}
						//	alert(_options.redisplay);
						options.startsWith = _options.redisplay;
						$(this).data("jprogressiveoptions", options);
						if (options.dataRetrieved) {
							displayTheFilteredList($(this));
						}
					}
					else {
						options = {};
						options = $.extend(options, config);
						options = $.extend(options, _options);
						options.dataRetrieved = !options.fetchAtMin;
						$(this).data("jprogressiveoptions", options);
						$(this).bind("keyup", function(){
							me = $(this);
							fireTimer(me);//we use a timeout function so that if
						});
					}
				
				
			});
		}
	})
})(jQuery);