/*!
 * nSpeech
 * nSpeech is screen reader library.
 *
 * https://github.com/nkhr7/nSpeech/
 *
 * Copyright 2017, Koichi Yoshimoto
 *
 * Version: 1.0.7
 *
 * Licensed under MIT
 *
 * Released on: 2017.10.19
 */
export default function nSpeech ( _selector, _options ){

  // unsupported.
  if (typeof SpeechSynthesisUtterance === "undefined") {
    alert("音声読み上げに未対応なブラウザです。\n\n音声読み上げ可能ブラウザ\nGoogle Chrome、Safari、Opera");
    return;
  }

  const self = Object.create(nSpeech.prototype);

  const defaultClassName = ".speech";

  // This is HTML class name by used to getElementsByClassName.
  let selector = (typeof _selector !== "undefined") ? _selector : defaultClassName;

  // speechSynthesis.getVoices
  let voices = [];

  // speechSynthesis
  const synth  = window.speechSynthesis;


  // In this case new nSpeech({ volume: 1 })
  // selector is default defaultClassName and options insert this.
  if ( typeof _selector === "object" ) {
    _options  = selector;
    selector = defaultClassName;
  }

  /**
  * Default Options
  *
  * lang          : This is spoken the language. ex: 'en-US'.
  * voice         : This will insert an object from the voice
  * volme         : Speech volume.
  * rate          : Speech rate. Speech gets faster if increase.
  * pitch         : Speech pitch. Speech gets shrill voice if increase
  * text          : Read this text.
  * selectId      : Create option elements in this id.
  * selectElement : Create this elements in selectId.
  * debug         : Debug Mode.
  */
  self.options = {
    lang          : "",
    voice         : null,
    volume        : 1,
    rate          : 1,
    pitch         : 1,
    text          : "",
    selectId      : "",
    selectElement : "option",
    onboundary : function () { return undefined; },
    onend      : function () { resetText(); return undefined; },
    onerror    : function () { return undefined; },
    onmark     : function () { return undefined; },
    onpause    : function () { return undefined; },
    onresume   : function () { return undefined; },
    onstart    : function () { return undefined; },
    debug   : false
  };

  // DOM Elements
  self.elements = [];

  self.utterance = new window.SpeechSynthesisUtterance();

  let provisionText = "";

  /**
  * Init
  */
  const init = function () {

    self.elements = getElements( selector );

    getSynthVoices();
    setOptions(_options);

    if ( voices.length > 0 ) {
      setOptionVoice();
      setMessage();
      setUtterance();
      outputVoiceSelect();
    }
  };


  /**
  * Gets elemtns by TagName, ID or className
  * @param  String str
  * @return NodeList
  */
  const getElements = function ( str ) {
    return document.querySelectorAll ( str );
  };


  /**
  * Set voices from speechSynthesis.getvoices.
  * We can't get voices before window.onbeforeunload.
  */
  const getSynthVoices = function () {
    // get voices.
    voices = synth.getVoices();
  };


  /**
  * Set options
  * To merge default options from user options.
  * If after new instance, we can use this function and change the options
  */
  const setOptions = function ( _options ) {

    // User denied options.
    if ( typeof _options === "object" ) {
      Object.keys(_options).forEach( function (key) {
        self.options[key] = _options[key];
      });
    }

  };


  /**
   * Default setting is a speechSynthesis voice by the default.
   * @param  String str Search voice in voice list.
   * @return Object     Voice object.
   */
  const getSelectVoice = function ( str ) {
    // To set default voice.
    let defaultVoice = {};

    if ( voices.length > 0 ) {
      // Voices loop
      for ( const i in voices ) {

        // If this voice is defined language.
        if ( voices[i].lang === str ) {

          // Return voice object.
          return voices[i];

          // If this voice is the default language.
        } else if ( voices[i].default === true ) {

          // set default voice
          defaultVoice = voices[i];

        }
      }
    }
    // If not found the language that you want to get the language,
    return defaultVoice;
  };


  /**
  * Set option voice
  * If we want to use other language, can change by options.lang.
  */
  const setOptionVoice = function () {

    // set default voice to options.voice
    self.options.voice = getSelectVoice( self.options.lang );

  };


  /**
  * Set message to read text
  */
  const setMessage = function () {
    // To set message string.
    let message = formatText ( self.options.text );

    const length = self.elements.length;
    for (let i = 0; i < length; ++i) {
      let txt;

      if ( self.elements[i].tagName === "INPUT" || self.elements[i].tagName === "TEXTAREA" ) {
        txt = self.elements[i].value;

      } else {
        // Inset text
        txt = self.elements[i].textContent;
      }

      message += formatText ( txt ) + " ";
    }

    // Insert message to default text
    self.options.text = message;
  };


  /**
  * Set Utterance with utteranceOptions.
  */
  const setUtterance = function () {

    self.utterance.voice      = self.options.voice;
    self.utterance.volume     = self.options.volume;
    self.utterance.rate       = self.options.rate;
    self.utterance.pitch      = self.options.pitch;
    self.utterance.text       = self.options.text;
    self.utterance.onboundary = self.options.onboundary;
    self.utterance.onend      = self.options.onend;
    self.utterance.onerror    = self.options.onerror;
    self.utterance.onmark     = self.options.onmark;
    self.utterance.onpause    = self.options.onpause;
    self.utterance.onresume   = self.options.onresume;
    self.utterance.onstart    = self.options.onstart;

    if ( self.options.debug ) { console.log(self.utterance); }
  };


  /**
  * Replace contiguous spaces and new line to a period.
  * @param  String str
  * @return String
  */
  const formatText = function ( str ) {
    // For set text.
    let txt = "";
    // Regex contiguous spaces and line code.
    const formatReg = /[\r]+|[\n]+|[\n\r]+|[\s]{2,}/g;
    // Regex Contiguous periods.
    let adjustFormatReg = /[. ]{2,}/g;
    // Replace this text by regex..
    let replacePeriod = '. ';

    // The voice language is Japanese.
    if ( self.options.voice.lang === "ja-JP" ) {
      // Change the period string to japanese.
      adjustFormatReg = /。{2,}/g;
      replacePeriod = '。';
    }

    if ( typeof str !== "undefined" && typeof str === "string" ) {
      // First format
      // This text exists contiguous periods because of line code and spaces continuous.
      txt = str.replace(formatReg, replacePeriod).trim();

      // second format
      txt = txt.replace(adjustFormatReg, replacePeriod).trim();
    }

    return txt;
  };


  /**
   * Set the override the text selection.
   * @return bool
   */
  const setSelection = function () {

    let str = "";

    // Get the text selection.
    if ( window.getSelection ) {
      str = window.getSelection().toString();
    } else {
      // For IE
      str = document.selection.createRange().text;
    }

    // If get selection text.
    if ( str !== "" ) {
      // Keep default text.
      provisionText = self.utterance.text;

      // Set the text selection.
      self.utterance.text = formatText(str);
      return true;
    }
    return false;
  };


  /**
   * Reset utterance.text if this is changed by override the text selection.
   * @return bool
   */
  const resetText = function () {
    if ( provisionText !== "" ) {
      // Restore default text.
      self.utterance.text = provisionText;
      return true;
    }
    return false;
  };


  /**
   * Create voice list elements by options.selectId,
   * Default element is option.
   * Default selectId is empty.
   */
  const outputVoiceSelect = function () {

    // If found element by id.
    if ( document.getElementById(self.options.selectId) ) {
      for ( let i = 0; i < voices.length; i++ ) {

        const option = document.createElement(self.options.selectElement);

        option.textContent = voices[i].name + " (" + voices[i].lang + ")";
        option.setAttribute("value", voices[i].lang);

        document.getElementById(self.options.selectId).appendChild(option);

      }
    }

  };


  /**
  * player controllers
  */
  // play
  self.play = function () {
    // If not setup options.
    if ( self.options.voice === null ) {
      init();
    }

    // Repalce text when getSelection.
    setSelection();

    synth.speak( self.utterance );

    if ( self.options.debug ) { console.log(self.utterance); }
  };

  // pause
  self.pause = function () {
    synth.pause( self.utterance );
  };

  // resum
  self.resume = function () {
    synth.resume( self.utterance );
  };

  // stop
  self.stop = function () {
    resetText();
    synth.cancel();
  };


  /**
   * Change options
   */
  self.replaceText = function ( str ) {
    self.utterance.text = str;
  };
  // This lang is string. ex: 'en-US'.
  self.changeVoice = function ( lang ) {
    self.utterance.voice = getSelectVoice(lang);
  };

  self.changeVolume = function ( value ) {
    self.utterance.volume = value;
  };

  self.changeRate = function ( value ) {
    self.utterance.rate = value;
  };

  self.changePitch = function ( value ) {
    self.utterance.pitch = value;
  };


  /**
  * Callback methods
  */
 // Fired when the spoken utterance reaches a word or sentence boundary.
  self.onboundary = function ( fn ) {
    if ( typeof fn === "function" ) {
      setOptions( { onboundary: fn } );
    }
  };

  // Fire when finish.
  self.onend = function ( fn ) {
    resetText();
    if ( typeof fn === "function" ) {
      setOptions( { onend: fn } );
    }
  };

  // Fire when an error occurs.
  self.onerror = function ( fn ) {
    if ( typeof fn === "function" ) {
      setOptions( { onerror: fn } );
    }
  };

  // Fired when the spoken utterance reaches a named SSML "mark" tag.
  self.onmark = function ( fn ) {
    if ( typeof fn === "function" ) {
      setOptions( { onmark: fn } );
    }
  };

  // Fire when pause.
  self.onpause = function ( fn ) {
    if ( typeof fn === "function" ) {
      setOptions( { onpause: fn } );
    }
  };

  // Fire when resume.
  self.onresume = function ( fn ) {
    if ( typeof fn === "function" ) {
      setOptions( { onresume: fn } );
    }
  };

  // Fire when start.
  self.onstart = function ( fn ) {
    if ( typeof fn === "function" ) {
      setOptions( { onstart: fn } );
    }
  };



  // When getting out a tab.
  window.onbeforeunload = function () {
    self.stop();
  };


  if (synth.onvoiceschanged !== undefined) {
    // Fired when enable getVoices.
    synth.onvoiceschanged = init;
  }


  init();

  return self;
}
