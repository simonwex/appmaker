/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(
  ["jquery", "ceci", "ceci-app", "jquery-ui"],
  function($, Ceci) {
    "use strict";

    var selection = [];

    var zIndex = 100;
    function moveToFront(element) {
      element.css('z-index', ++zIndex);
    }

    var app = new Ceci.App({
      container: $('#flathead-app')[0],
      onComponentAdded: function (component) {
        component = $(component);

        component.on('mouseenter', function () {
          component.append('<div class="handle"></div>');
        }).on('mouseleave', function () {
          $('.handle').remove();
        });

        component.on('mousedown', function(evt) {
          selectComponent($(evt.currentTarget));
        });

        selectComponent(component);
      },
      onload: function (components) {
        // create first card as a default card
        createCard();

        $.each(components, function(index, value) {
          var thumb = $('<div class="clearfix draggable" name="' + index + '" value="' + index + '"><div class="thumb" value="' + index + '">' + index.replace('app-', '') + '</div><div class="info-btn hidden"></div></div>');
          $('.library-list').append(thumb);
          thumb.draggable({
            connectToSortable: ".drophere",
            helper: "clone",
            appendTo: document.body,
            start : function(event,ui){
              var clone = ui.helper;
              $(clone).find(".thumb").addClass("im-flying");
              clone.find('.info-btn').remove();
            },
            addClass: "clone"
          });
          if (value.description) {
            var componentDescription = value.description.innerHTML;
            thumb.attr('description', componentDescription);
          } else {
            thumb.attr('description', 'No description');
          }
        });

        $('.library-list').removeClass("library-loading");
      }
    });

    $(document).on('mouseenter', '.draggable', function () {
      $(this).children('.info-btn').show();
    }).on('mouseleave', '.draggable', function () {
      $(this).children('.info-btn').hide();
    });

    function Channel(name, title, hex) {
      // make sure the name is a string
      this.name = String(name);
      this.title = title;
      this.hex = hex;
    }

    var channels = [
      new Channel('blue', 'Blue Moon', '#358CCE'),
      new Channel('red', 'Red Baloon', '#e81e1e'),
      new Channel('pink', 'Pink Heart', '#e3197b'),
      new Channel('purple', 'Purple Horseshoe', '#9f27cf'),
      new Channel('green', 'Green Clover', '#71b806'),
      new Channel('yellow', 'Yellow Pot of Gold', '#e8d71e'),
      new Channel('orange', 'Orange Star', '#ff7b00'),
      new Channel(Ceci.emptyChannel, 'Disabled', '#444')
    ];


    //TODO: Angular this up
    // generate the channels list (colored clickable boxes) and append to the page
    function getChannelStrip(forAttribute) {
      var strip = $('<div class="colorstrip" id="strip-' + forAttribute + '"></div>');

      for (var i in channels) {
        var rdata = channels[i];

        strip.append(
          $('<div class="colorChoice '+ rdata.name +'" value="'+ rdata.hex +'" name="'+ rdata.name +'" title="'+ rdata.title +'" style="background-color: '+ rdata.hex +'"></div>')
        );
      }
      return strip;
    }

    // get a Channel object given a channel name
    function getChannelByChannelName(channelName) {
      for (var i in channels) {
        if(channels[i].name === channelName) {
          return channels[i];
        }
      }
      return false;
    }

    // empty the list of currently selected elements on the page
    var clearSelection = function() {

      selection.forEach(function(element) {
        $(document).off("click", ".colorChoice", element.onColorSelectFunction);
      });

      selection = [];
      $(".selected").removeClass("selected");
      $(".inspector").addClass('hidden');

      //hide delete button
      $('.delete-btn').hide();

      //hide customize button and section
      $('.customize-btn').hide().removeClass('selected-button');
      $('.editables-section').hide();
    };

    // jQuery-UI property for reordering items in the designer
    function enableReorder() {
      $(".phone-canvas,.fixed-top,.fixed-bottom").disableSelection().sortable({
        connectWith: ".drophere",
        placeholder: "ui-state-highlight",
        start : function() { $(".phone-container").addClass("dragging"); },
        stop : function() { $(".phone-container").removeClass("dragging"); }
      });
      // FIXME: do we need this line if we already explicitly set all the sortable props?
      $(".phone-canvas,.fixed-top,.fixed-bottom").sortable("enable");
    }

    var disableReorder = function() {
      $(".phone-canvas,.fixed-top,.fixed-bottom").sortable("disable");
    };

    clearSelection();
    enableReorder();

    $(document).on('click', '.container', function (evt) {
      if ($(evt.target).hasClass('container')) {
        clearSelection();
      }
    });

    // document-level key handling
    $(document).on('keydown', function(event) {
      // escape hides all modal dialogs
      if (event.which === 27) {
        $('.color-modal').removeClass('flex');
        // and clears the selection non-destructively
        clearSelection();
      }
      // delete removes all selected items.
      else if (event.which === 46) {
        var elements = selection.slice();
        clearSelection();
        elements.forEach(function(element) {
          element.removeSafely();
        });
      }
    });

    $('.delete-btn').click(function () {
      var elements = selection.slice();
        clearSelection();
        elements.forEach(function(element) {
          element.removeSafely();
        });
    });

    var displayBroadcastChannel = function () {
      var bo = $(".broadcast-options");
      bo.html("");
      var strip = getChannelStrip("broadcast");
      bo.append(strip);
    };

    var getPotentialListeners = function(element) {
      return element.subscriptionListeners.map(function(listener) {
        var subscription;
        element.subscriptions.forEach(function(s) {
          if(s.listener === listener) {
            subscription = s;
          }
        });
        if(!subscription) {
          subscription = {
            channel: Ceci.emptyChannel,
            listener: listener
          };
        }
        return subscription;
      });
    };

    var displayListenChannel = function (attribute) {
      var lo = $(".listen-options");
      lo.html("");
      var strip = getChannelStrip(attribute);
      lo.append(strip);
    };

    var getAttributeUIElement = function(element, attributeName, definition) {
      var value = element.getAttribute(attributeName);
      value = value !== null ? value : '';

      switch(definition.type) {
        case "text": return (function() {
                        // TODO: This would be a fine place for angular
                        var e = $("<div><label>" +
                          definition.title +
                          "</label><input type=\"text\" value=\"" +
                          value +
                          "\"></input></div>"
                        );

                        e.on("change", function(evt) {
                          element.setAttribute(attributeName, evt.target.value);
                        });
                        return e[0];
                      });
        case "number": return (function() {
                        // TODO: This would be a fine place for angular
                        var e = $(
                          "<div><label>" +
                          definition.title +
                          "</label><input type=\"number\" min=\"" +
                          definition.min +
                          "\" max=\"" +
                          definition.max +
                          "\" value=\"" +
                          value + "\" /></div>"
                        );
                        e.on("change", function(evt) {
                          element.setAttribute(attributeName, evt.target.value);
                        });
                        return e[0];
                      });
        case "boolean": return (function() {
                        // TODO: This would be a fine place for angular
                        var e = $(
                          "<div><label>" +
                          definition.title +
                          "</label><input type=\"checkbox\" " +
                          (value == "true" ? " checked=\"true\" " : "") + "\" value=\"" +
                          value + "\" /></div>"
                        );
                        e.on("change", function(evt) {
                          evt.target.value = evt.target.value == "true" ? "false" : "true";
                          element.setAttribute(attributeName, evt.target.value == "true" ? true : false);
                        });
                        return e[0];
                      });

      }
      return $("<span>"+definition.type+" not implemented yet</span>");
    };

    var displayAttributes = function(element) {
      $('.editables-section .editables').html("");
      if (element.getEditableAttributes().length > 0) {
        $('.customize-btn').show();
      } else {
        $('.customize-btn').hide();
      }
      var attributes = element.getEditableAttributes();
      var attributeList = $("<div class='editable-attributes'></div>");

      attributes.forEach(function(attribute) {
        var definition = element.getAttributeDefinition(attribute);
        var uiElement = getAttributeUIElement(element, attribute, definition);
        attributeList.append(uiElement);
      });
      $('.editables-section .editables').append(attributeList);
    };

    //Toggle customize
    $('.customize-btn').click(function () {
      if ($(this).hasClass('selected-button')) {
        $('.editables-section').hide();
        $(this).removeClass('selected-button');
      } else {
        $('.editables-section').show();
        $(this).addClass('selected-button');
      }
    });

    //Toggle the log
    $('.log-toggle').click(function () {
      if ($(this).hasClass('selected-button')) {
        $('.log').hide();
        $(this).removeClass('selected-button');
      } else {
        $('.log').show();
        $(this).addClass('selected-button');
      }
    });

    var selectComponent = function(comp) {

      clearSelection();

      if(comp.find(".channel-chooser").length === 0){
        $(".channel-chooser").appendTo("body").hide();
      }

      var element = comp[0];
      var compId = element.id;
      selection.push(element);
      comp.addClass("selected");
      moveToFront(comp);

      $('.delete-btn').show();

      //Show broadcast channel options on click of broadcast channel
      $(document).on('click', '.broadcast-channels .channel', function (event) {
        var bChannels = $(".broadcast-section");
        var t = $(this).position();
        $(this).parent().append(bChannels);
        bChannels.css("top",t.top + 27);
        bChannels.show();
        displayBroadcastChannel();
      });

      //Show subscription channel options on click of subcription channel
      $(document).on('click', '.subscription-channels .channel', function (evt) {

        var lChannels = $(".listen-section");
        var t = $(this).position();
        $(this).parent().append(lChannels);
        lChannels.css("top",t.top + 27).show();

        // find listener this is for:
        var target = evt.target;
        if(target.classList.contains("dot")) {
          target = target.parentNode;
        }
        var listener = target.getAttribute("title");
        displayListenChannel(listener);
      });

      //Show editable attributes
      displayAttributes(element);

      //Changes component channel
      var onColorSelectFunction = function () {
        var comp = $(this);

        var channel = {
          hex: comp.attr('value'),
          name: comp.attr('name'),
          title: comp.attr('title')
        };

        // change broadcast "color"
        if (comp.parents().hasClass('broadcast-options')) {
          element.setBroadcastChannel(channel.name);
          displayBroadcastChannel(channel.name);
        }

        // change listening "color"
        else {
          var attribute = comp.parent().attr("id").replace("strip-",'');
          if(attribute) {
            element.setSubscription(channel.name, attribute);
            displayListenChannel(attribute);
          }
        }
      };

      // listen for color clicks
      $(document).on('click', '.colorChoice', onColorSelectFunction)
      .on('click', '.colorChoice', function (event) {
        $('.broadcast-section, .listen-section').hide().appendTo("body");
      });

      // give the element the function we just added, so we
      // can unbind it when the element gets unselected.
      element.onColorSelectFunction = onColorSelectFunction;

      var componentName = element.tagName.toLowerCase();
      $(".editables-section .name").text(componentName);
      $(".inspector").removeClass('hidden');
    };

    // logs messages
    $(document).on('broadcast', function (event, message) {
      var log = $('.log .inner p').append('<div>' + message + '</div>');
      var scroll = $(".scroll")[0];
      scroll.scrollTop = scroll.scrollHeight;
    });

    //shows component description
    var showComponentDescription = function (xPos, yPos, component, compDescription) {
      var componentDescription = $('<div class="component-description"></div>');
      componentDescription.css({top: yPos, left: xPos});
      componentDescription.text(compDescription);
      $(document.body).append(componentDescription);
    };

    $(document).on('mouseenter', '.info-btn', function () {
      var yPos = $(this).offset().top - 9 + 'px';
      var xPos = $(this).offset().left + 40 + 'px';
      var component = $(this).parents('.draggable').attr('value');
      var compDescription = $(this).parents('.draggable').attr('description');
      showComponentDescription(xPos, yPos, component, compDescription);
    }).on('mouseleave', '.info-btn', function () {
      $('.component-description').remove();
    });

    // this options object makes components drag/droppable when passed
    // to the jQueryUI "sortable" function.
    var sortableOptions = {
      accept: '.draggable',
      distance : 10,
      receive: function (event, ui) {
        if (ui.helper) {
          var helper = $(ui.helper);

          app.addComponent(helper.attr('value'), function(component){
            component = $(component);

            var dropTarget = $(".drophere").find(".draggable");
            dropTarget.replaceWith(component);

            component.draggable({
              handle: 'handle'
            });
          });
        }
      }
    };

    $('.drophere').sortable(sortableOptions);

    var createCard = function() {
      var card = Ceci.createCard();
      $('.drophere', card).sortable(sortableOptions);
      $('#flathead-app').append(card);
      card.showCard();
      enableReorder();

      // create card thumbnail
      var newthumb = $('<div class="card">' + ($(".card").length + 1) + '</div>');
      newthumb.click(function() {
        card.showCard();
      });
      $(".cards").append(newthumb);
    };

    $(".btn-add").click(createCard);

    $('.publish').click(function(){
      var htmlData = $('.phone-canvas')[0].outerHTML;
      $.ajax('/publish', {
        data: { html: htmlData },
        type: 'post',
        success: function (data) {
          $('.publish-url').html(data.filename);
          $('.publish-url').attr('href', data.filename);
        },
        error: function (data) {
          console.error('Error while publishing content:');
          console.error(data);
        }
      });
    });

    //Publish modal
    $('.publish').click(function () {
      $('.modal-wrapper').addClass('flex');
    });

    $('.return-btn').click(function () {
      $('.modal-wrapper').removeClass('flex');
    });

    // AMD module return
    return {
      Ceci: Ceci,
      App: Ceci.App
    };
  }
);
