/*jshint esversion: 6, node:true, browser: true, jquery:true */

//HurryUp floating block

const LAND_SETTINGS = {
  /*hurryUpID - floating block ID in format '#selector'. Leave empty if hurryUP block isn't required*/
  hurryUpID: "#js_hurryup",
  redBtnID: "#js-red-btn",
  footerClass: ".foot",
  headerClass: ".header",
  navClass: ".nav",
  scrollElClass: ".scrollTo",
  formsClass: ".al-form",
  // Селектор сабмитов с форм лендинга (не должен совпадать с классом сабмитов с попапов)
  formSubmitClass: ".form__submit",
  //Массив содержащий коды локализаций lang для которых нужен чекбокс в форме
  counriesCheckBox: ["bg", "el"]
};

(function($) {
  "use strict";
  class Landing {
    constructor(settings) {
      //All settings
      this.set = settings;
      //global setting detect is red button clicked
      this.isRedBtnClicked = false;
      //global setting detect if scroll position is between header and footer
      this.isCenter = false;
    }

    //метод меняет классы баннера с количеством товара в зависимости от скролла
    changeHurryUpClass(
      node,
      btn,
      headerNode,
      footerNode,
      scrollOffset,
      topPoint,
      btmPoint
    ) {
      if (!topPoint) topPoint = headerNode.getNodeOffsets().bottom;
      if (!btmPoint)
        btmPoint = footerNode.getNodeOffsets().top - window.innerHeight;

      if (scrollOffset < topPoint) {
        if (this.isCenter) {
          node.attr("style", "");
          this.isCenter = false;
        }
        this.isRedBtnClicked = false;

        headerNode.append(node);

        btn.removeClass("js_active");
        node.removeClass("js_fixed");
        node.addClass("js_absolute");
      } else if (scrollOffset >= topPoint && scrollOffset < btmPoint) {
        $("body").append(node);
        this.isCenter = true;
        if (!this.isRedBtnClicked) {
          btn.addClass("js_active");
        }
        node.removeClass("js_absolute");
      } else {
        if (this.isCenter) {
          node.attr("style", "");
          this.isCenter = false;
        }
        this.isRedBtnClicked = false;
        footerNode.append(node);

        btn.removeClass("js_active");
        node.removeClass("js_fixed");
        node.addClass("js_absolute");
      }
    }
    changeNavigationClass(
      node,
      submitBtns,
      scrollOffset,
      startPoint,
      endPoint
    ) {
      if (scrollOffset > startPoint && scrollOffset < endPoint) {
        node.fadeIn(300).addClass("floating");
      } else {
        node.removeClass("floating").fadeOut(300);
      }
    }
    //метод проверяет нужен ли чекбокс в формах
    isCheckBoxCounrty() {
      const country = document.documentElement.lang;
      return this.set.counriesCheckBox.indexOf(country.toLowerCase()) >= 0
        ? true
        : false;
    }
    //метод обновляющий формы
    createLocalForms() {
      if (!this.isCheckBoxCounrty()) {
        let checkWrap = $(".js_check-wrap");
        checkWrap.remove();
      } else {
        let agreements = $('[name="policy"]');
        if (agreements.length) {
          for (let i = 0; i < agreements.length; i++) {
            let curAgreement = agreements[i];
            curAgreement.addEventListener("click", function() {
              let submit = this.form.querySelector(".js-submit");
              if (!this.checked) {
                submit.setAttribute("disabled", true);
              } else {
                submit.removeAttribute("disabled");
              }
            });
          }
        }
      }
    }
    toggleNavItemsClass(scrollOffset, navbarItems) {
      for (let i = 0; i < navbarItems.length; i++) {
        $(navbarItems[i]).removeClass("active");
        let selector = navbarItems[i].getAttribute("href"),
          currentSection = $(selector);
        let sectionCoords = currentSection.getNodeOffsets();
        if (
          scrollOffset > sectionCoords.top - window.innerHeight / 3 &&
          scrollOffset < sectionCoords.bottom
        ) {
          $(navbarItems[i]).addClass("active");
        }
      }
    }
    //Need to fix shift elements when one of group comes bold
    fixBoldShift(navbarItems) {
      for (let i = 0; i < navbarItems.length; i++) {
        let link = $(navbarItems[i]);
        link.attr("title", link.text());
      }
    }
    getFormsOffsets(forms) {
      let offsets = [];
      $.each(forms, function(index, form) {
        offsets.push($(form).getNodeOffsets().top);
      });
      return offsets;
    }

    updateOrderBtnLink(orderBtn, forms, formsOffsets, scrollOffset) {
      let min = Number.POSITIVE_INFINITY,
        index = 0;
      for (let i = 0; i < formsOffsets.length; i++) {
        let diff = Math.abs(formsOffsets[i] - scrollOffset);
        if (diff < min) {
          min = diff;
          index = i;
        }
      }
      orderBtn.attr("href", "#" + forms[index].id);
    }

    screenDetect(breakpoint) {
      return this.screenWidth() > breakpoint ? false : true;
    }

    screenWidth() {
      return Math.max(window.innerWidth, document.documentElement.clientWidth);
    }

    initLanding() {
      this.createLocalForms();

      //DOM nodes
      const HEADER = $(this.set.headerClass),
        FOOTER = $(this.set.footerClass),
        HURRYUP = $(this.set.hurryUpID),
        REDBTN = $(this.set.redBtnID),
        FORM_SUBMIT = $(this.set.formSubmitClass),
        FORMS = $(this.set.formsClass),
        SCROLL_LINKS = $(this.set.scrollElClass),
        NAV = $(this.set.navClass),
        NAV_LINKS = NAV.find(".link"),
        NAV_ORDER_BTN = NAV.find(".order-btn"),
        IS_MOBILE = this.screenDetect(991);
      //ELEMENTS OFFSETS
      const HEADER_BTM = HEADER.getNodeOffsets().bottom,
        FOOTER_TOP = FOOTER.getNodeOffsets().top - window.innerHeight,
        //forms offsets
        FORMS_OFFSETS = this.getFormsOffsets(FORMS),
        //first submit
        F_SUBMIT_OFFSET = $(FORM_SUBMIT[0]).getNodeOffsets().bottom,
        //last submit
        L_SUBMIT_OFFSET =
          $(FORM_SUBMIT[FORM_SUBMIT.length - 1]).getNodeOffsets().top -
          window.innerHeight;

      if (this.set.hurryUpID) {
        const hurryUpCloseBtn = HURRYUP.find(".hurryup__close");
        hurryUpCloseBtn.on("click", e => {
          e.preventDefault();
          let target = $(e.target);
          let hurryUP = target.closest("#js_hurryup");
          hurryUP.fadeOut().css("top", "10px");
          this.isRedBtnClicked = false;
        });
      }
      if (this.set.redBtnID) {
        const _this = this;
        REDBTN.on("click", function(e) {
          e.preventDefault();
          _this.isRedBtnClicked = true;
          HURRYUP.attr("style", "");
          HURRYUP.addClass("js_fixed");
          $(this).removeClass("js_active");
        });
      }

      $(document).scroll(() => {
        let scrollOffset = $(document).scrollTop();
        this.changeHurryUpClass(
          HURRYUP,
          REDBTN,
          HEADER,
          FOOTER,
          scrollOffset,
          HEADER_BTM,
          FOOTER_TOP
        );
        this.changeNavigationClass(
          NAV,
          FORM_SUBMIT,
          scrollOffset,
          F_SUBMIT_OFFSET,
          L_SUBMIT_OFFSET
        );
        this.fixBoldShift(NAV_LINKS);
        this.toggleNavItemsClass(scrollOffset, NAV_LINKS);
        this.updateOrderBtnLink(
          NAV_ORDER_BTN,
          FORMS,
          FORMS_OFFSETS,
          scrollOffset
        );
      });

      SCROLL_LINKS.on("click", e => {
        e.preventDefault();
        let elem = $(e.target).closest("[href]");
        let target = $(elem).attr("href");

        $("html, body").animate(
          {
            scrollTop: $(target).offset().top - 150
          },
          500
        );
      });
    }
  }
  //return top and bottom
  $.fn.getNodeOffsets = function() {
    let topPoint = this.offset().top,
      btmPoint = this.offset().top + this.height();
    return {
      top: topPoint,
      bottom: btmPoint
    };
  };

  //INIT Landing instance
  const seafit = new Landing(LAND_SETTINGS);
  seafit.initLanding();
})(jQuery);
