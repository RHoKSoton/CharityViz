(function( $ ){

  $.fn.projectViz = function( type ) {  

	return this.each(function() {
		var $this = $(this);
		console.log($this.attr('data-itai'));
    });

  };
})( jQuery );
