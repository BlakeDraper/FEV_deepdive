//////setting event 3 ways (core.js)////////////////////
//listener for submit event button on welcome modal - sets event vars and passes event id to filterMapData function
	$('#btnSubmitEvent').click(function(){
		//check if an event has been selected
		if ($('#evtSelect_welcomeModal').val() !== null) {
			//if event selected, hide welcome modal and begin filter process
			$('#welcomeModal').modal('hide');
			var eventID = $('#evtSelect_welcomeModal').val()[0];
			$('#evtSelect_filterModal').val([eventID]).trigger("change");
			//retrieve event details
			$.getJSON( 'https://stn.wim.usgs.gov/STNServices/events/' + eventID + '.json', {} )
				.done(function( data ) {
					setEventVars(data.event_name, data.event_id, data.event_status_id, data.event_start_date, data.event_end_date);
				})
				.fail(function() {
					console.log( "Request Failed. Most likely invalid event name." );
				});
			//populateEventDates(eventID);
			filterMapData(eventID, false);
		} else {
			//if no event selected, warn user with alert
			//alert("Please choose an event to proceed.")
			$('.eventSelectAlert').show();
		}
	});

	//listener for submit filters button on filters modal - sets event vars and passes event id to filterMapData function
	$('#btnSubmitFilters').on('click', function() {

		if ($('#evtSelect_filterModal').val() !== null) {
			//if event selected, hide welcome modal and begin filter process
			$('#welcomeModal').modal('hide');
			var eventID = $('#evtSelect_filterModal').val()[0];
			//$('#evtSelect_filterModal').val([eventValue]).trigger("change");
			//retrieve event details
			for (var i = 0; i < fev.data.events.length; i++) {
				if (fev.data.events[i].event_id == eventID) {
					//set currentEventActive boolean var based on event_status_id value
					setEventVars(fev.data.events[i].event_name, fev.data.events[i].event_id, fev.data.events[i].event_status_id, fev.data.events[i].event_start_date, fev.data.events[i].event_end_date);
				}
			}
			filterMapData(eventID, false);
			$('.eventSelectAlert').hide();
			$('#filtersModal').modal('hide');
		} else {
			//if no event selected, warn user with alert
			//alert("Please choose an event to proceed.")
			$('.eventSelectAlert').show();
		}
	});

	//'listener' for URL event params - sets event vars and passes event id to filterMapData function
	if (window.location.hash){
		//user has arrived with an event name after the hash on the URL
		//grab the hash value, remove the '#', leaving the event name parameter
		var eventParam = window.location.hash.substring(1);
		//retrieve event details
		$.getJSON( 'https://stn.wim.usgs.gov/STNServices/events/' + eventParam + '.json', {} )
			.done(function( data ) {
				var eventID = data.event_id.toString();
				setEventVars(data.event_name, data.event_id, data.event_status_id, data.event_start_date, data.event_end_date);
				//call filter function, passing the eventid parameter string and 'true' for the 'isUrlParam' boolean argument
				filterMapData(eventID, true);
			})
			.fail(function() {
				console.log( "Request Failed. Most likely invalid event name." );
			});

	} else {
		//show modal and set options - disallow user from bypassing
		$('#welcomeModal').modal({backdrop: 'static', keyboard: false});
	}


////Option 2: nwis fix//////////////////////////

///fix to prevent re-rendering nwis rt gages on pan (core.js)/////////////////////
map.on('load moveend zoomend', function(e) {
    
    var foundPopup;
    $.each(USGSrtGages.getLayers(), function( index, marker ) {
        var popup = marker.getPopup();
        if (popup) {
            foundPopup = popup._isOpen;
        }
    })
    //USGSrtGages.clearLayers();
    if (map.getZoom() < 9) {
        USGSrtGages.clearLayers();
        $('#rtScaleAlert').show();
    }

    if (map.getZoom() >= 9){
        $('#rtScaleAlert').hide();
    }
    if (map.hasLayer(USGSrtGages) && map.getZoom() >= 9 && !foundPopup) {
        //USGSrtGages.clearLayers();
        $('#nwisLoadingAlert').show();
        var bbox = map.getBounds().getSouthWest().lng.toFixed(7) + ',' + map.getBounds().getSouthWest().lat.toFixed(7) + ',' + map.getBounds().getNorthEast().lng.toFixed(7) + ',' + map.getBounds().getNorthEast().lat.toFixed(7);
        queryNWISrtGages(bbox);
    }
});




    /////////////////Option 3: dislaying sensor geoJSON////////////////////

    function displaySensorGeoJSON(type, name, url, markerIcon) {
    //increment layerCount
    layerCount++;
    var currentSubGroup = eval(type);
    currentSubGroup.clearLayers();
    var currentMarker = L.geoJson(false, {
        pointToLayer: function(feature, latlng) {
            markerCoords.push(latlng);
            var marker = L.marker(latlng, {
                icon: markerIcon
            });
            return marker;
        },
        onEachFeature: function (feature, latlng) {
            //add marker to overlapping marker spidifier
            oms.addMarker(latlng);
            //var popupContent = '';
            if (type == 'rdg') {return};
            var currentEvent = fev.vars.currentEventName;
            var popupContent =
                '<table class="table table-hover table-striped table-condensed wim-table">'+
                    '<caption class="popup-title">' + name + ' | <span style="color:gray"> ' + currentEvent + '</span></caption>' +
                    '<tr><td><strong>STN Site Number: </strong></td><td><span id="siteName">'+ feature.properties.site_no+'</span></td></tr>'+
                    '<tr><td><strong>Status: </strong></td><td><span id="status">'+ feature.properties.status+'</span></td></tr>'+
                    '<tr><td><strong>City: </strong></td><td><span id="city">'+ (feature.properties.city == ''|| feature.properties.city == null || feature.properties.city == undefined ? '<i>No city recorded</i>' : feature.properties.city ) + '</span></td></tr>'+
                    '<tr><td><strong>County: </strong></td><td><span id="county">' + feature.properties.county +'</span></td></tr>'+
                    '<tr><td><strong>State: </strong></td><td><span id="state">'+feature.properties.state+'</span></td></tr>'+
                    '<tr><td><strong>Latitude, Longitude (DD): </strong></td><td><span class="latLng">'+feature.properties.latitude_dd.toFixed(4)+', ' + feature.properties.longitude_dd.toFixed(4)+'</span></td></tr>'+
                    '<tr><td><strong>STN data page: </strong></td><td><span id="sensorDataLink"><b><a target="blank" href=' + sensorPageURLRoot + feature.properties.site_id + '&Sensor=' + feature.properties.instrument_id+ '\>Sensor data page</a></b></span></td></tr>'+
                '</table>';
            latlng.bindPopup(popupContent);
        }
    });

    $.getJSON(url, function(data) {

        if (data.length == 0) {
            console.log( '0 ' + markerIcon.options.className + ' GeoJSON features found');
            return
        }
        if (data.features.length > 0) {
            console.log( data.features.length + ' ' + markerIcon.options.className + ' GeoJSON features found');
            //check for bad lat/lon values
            for (var i = data.features.length - 1; i >= 0; i--) {
                //check that lat/lng are not NaN
                if (isNaN(data.features[i].geometry.coordinates[0]) || isNaN(data.features[i].geometry.coordinates[1])) {
                    console.error("Bad latitude or latitude value for point: ", data.features[i]);
                    //remove it from array
                    data.features.splice(i, 1);
                }
                //check that lat/lng are within the US and also not 0
                if (fev.vars.extentSouth <= data.features[i].geometry.coordinates[0] <= fev.vars.extentNorth && fev.vars.extentWest <= data.features[i].geometry.coordinates[1] <= fev.vars.extentEast || data.features[i].geometry.coordinates[0] == 0 || data.features[i].geometry.coordinates[1] == 0){
                    console.error("Bad latitude or latitude value for point: ", data.features[i]);
                    //remove it from array
                    data.features.splice(i, 1);
                }
            }
            currentMarker.addData(data);
            currentMarker.eachLayer(function(layer) {
                layer.addTo(currentSubGroup);
            });
            currentSubGroup.addTo(map);
            if (currentSubGroup == 'rdg') {
                alert("RDG feature created");
            }

            checkLayerCount(layerCount);
        }
    });
}

 //main loop over layers
    $.each(fev.layerList, function( index, layer ) {
        if(layer.Type == 'sensor') displaySensorGeoJSON(layer.ID, layer.Name, fev.urls[layer.ID + 'GeoJSONViewURL'] + fev.queryStrings.sensorsQueryString, window[layer.ID + 'MarkerIcon']);
        if(layer.ID == 'hwm') displayHWMGeoJSON(layer.ID, layer.Name, fev.urls.hwmFilteredGeoJSONViewURL + fev.queryStrings.hwmsQueryString, hwmMarkerIcon);
        if(layer.ID == 'peak') displayPeaksGeoJSON(layer.ID, layer.Name, fev.urls.peaksFilteredGeoJSONViewURL + fev.queryStrings.peaksQueryString, peakMarkerIcon);
    });