import React, { useState, useRef, useEffect } from "react";
import { useAtom } from "jotai";
import { isGameTutorialModalOpenAtom } from "@/atoms/modalAtom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleLeft,
  faAngleRight,
  faDiamond,
  faHeart,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { gsap } from "gsap";
import CLUB_JACK from "/cards/J♣.svg";
import DIAMOND_JACK from "/cards/J♦.svg";
import HEART_JACK from "/cards/J♥.svg";
import SPADE_JACK from "/cards/J♠.svg";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function GameTutorialModal() {
  const [isOpen, setIsOpen] = useAtom(isGameTutorialModalOpenAtom);
  const [isSliding, setIsSliding] = useState(false);
  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  if (!isOpen) return null;

  const handleBeforeChange = () => {
    setIsSliding(true);
  };

  const handleAfterChange = () => {
    setIsSliding(false);
  };

  const handleOutsideClick = () => {
    if (!isSliding) {
      setIsOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOutsideClick}
    >
      <div
        style={{
          width: "calc(100% - 2rem)",
        }}
        className="main-font relative bg-white flex flex-col p-6 rounded shadow-lg max-w-md "
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="ml-auto cursor-pointer pointer-events-auto absolute
          flex justify-center items-center right-4 px-4 py-3 top-2 w-4 z-10"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
        <Slider
          {...settings}
          beforeChange={handleBeforeChange}
          afterChange={handleAfterChange}
        >
          <div className="flex items-center gap-2 justify-center flex-col">
            <h2 className="text-xl font-bold mb-2">카드로 하는 팀 오목</h2>
            <ul className="text-[.75rem] h-14 mb-2">
              <li>
                &bull; 짝수의 플레이어는 팀을 나눠 순서대로 번갈아가며
                플레이한다.
              </li>
              <li>&bull; 보드에는 한 카드가 놓을 수 있는 2개의 위치가 있다.</li>
              <li>&bull; 게임 중 카드에 대한 정보를 상의할 수 없다.</li>
            </ul>
            <SequenceSimulationOne />
          </div>

          <div className="flex items-center gap-2 justify-center flex-col">
            <h2 className="text-xl font-bold mb-2">시퀀스 룰</h2>
            <ul className="text-[.75rem] h-14 mb-2">
              <li>&bull; 5개를 놓으면 시퀀스 1개가 완성된다.</li>
              <li>&bull; 2개의 시퀀스를 먼저 완성하면 이긴다.</li>
              <li>
                &bull; 모서리에 있는 카드는 시퀀스에 포함하여 완성시킬 수 있다.
              </li>
            </ul>
            <SequenceSimulationTwo />
          </div>

          <div className="flex items-center gap-2 justify-center flex-col">
            <h2 className="text-xl font-bold mb-2">Jack 카드의 규칙</h2>
            <ul className="text-[.75rem] h-14 mb-2">
              <li>
                &bull; 스페이드 J, 하트 J는 상대방의 칩을 한 개 없앨 수 있다.
              </li>
              <li>
                &bull; 다이아몬드 J, 클로버 J는 내 칩을 원하는 곳에 놓을 수
                있다.
              </li>
            </ul>
            <div className="image-container hidden xs:flex w-[391px] h-80 border-black border-[.1rem]">
              <div className="flex w-full flex-col gap-2 text-center border-r-[.07rem]  border-black">
                <h3 className="mt-2">눈이 하나 있는 Jack</h3>
                <div className="flex gap-2 items-center justify-center">
                  <img src={SPADE_JACK} alt="Jack" className="w-20 h-24" />
                  <img src={HEART_JACK} alt="Jack" className="w-20 h-24" />
                </div>
                <div className="text-[.7rem] text-left p-4 border-black border-t-[.07rem]">
                  게임판에 놓인 상대 팀의 칩 1개를 제거한다.
                  <br />
                  이미 완성된 시퀀스에 포함된 칩은 제거할 수 없다.
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 text-center">
                <h3 className="mt-2">눈이 두 개 있는 Jack</h3>
                <div className="flex gap-2 items-center justify-center">
                  <img src={DIAMOND_JACK} alt="Jack" className="w-20 h-24" />
                  <img src={CLUB_JACK} alt="Jack" className="w-20 h-24" />
                </div>
                <div className="text-[.7rem] text-left p-4 border-black border-t-[.07rem]">
                  게임판의 비어있는 칸 중 원하는 곳에 칩 1개를 놓는다.
                </div>
              </div>
            </div>
          </div>
        </Slider>
      </div>
    </div>
  );
}

function SequenceSimulationOne() {
  const svgRefs = useRef([]);

  // 애니메이션을 트리거하는 함수
  const playAnimation = () => {
    gsap.set(svgRefs.current, { autoAlpha: 0 }); // 초기 상태: 보이지 않게 설정

    svgRefs.current.forEach((el, index) => {
      gsap.to(el, {
        autoAlpha: 1,
        delay: index * 1.5,
        duration: 0.5, // 애니메이션 지속 시간은 0.5초로 설정
      });
    });
  };

  useEffect(() => {
    playAnimation(); // 컴포넌트가 마운트될 때 애니메이션 실행
  }, []);
  return (
    <div
      className="image-container hidden xs:block relative h-80"
      onClick={playAnimation}
    >
      <img
        translate="no"
        className="pointer-events-none"
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Sequence-board-game.jpg/732px-Sequence-board-game.jpg"
        alt="Sequence Board Game"
      />

      {/* SVG 오버레이 */}
      {[
        { top: "32px", left: "47px", color: "blue" },
        { top: "116px", left: "124px", color: "orange" },
        { top: "32px", left: "87px", color: "blue" },
        { top: "60px", left: "7px", color: "orange" },
        { top: "32px", left: "127px", color: "blue" },
        { top: "115px", left: "7px", color: "orange" },
        { top: "144px", left: "164px", color: "blue" },
        { top: "60px", left: "164px", color: "orange" },
        { top: "256px", left: "315px", color: "blue" },
        { top: "32px", left: "164px", color: "orange" },
      ].map((item, index) => (
        <svg
          key={index}
          ref={(el) => (svgRefs.current[index] = el)}
          className="overlay-element absolute"
          width="36"
          height="36"
          style={{ top: item.top, left: item.left }}
        >
          <circle cx="18" cy="18" r="9" fill={item.color} />
        </svg>
      ))}
    </div>
  );
}

function SequenceSimulationTwo() {
  const sequenceBox1 = useRef(null);
  const sequenceBox2 = useRef(null);

  useEffect(() => {
    gsap.set(sequenceBox1.current, { autoAlpha: 0 }); // 초기 상태: 보이지 않게 설정
    gsap.set(sequenceBox2.current, { autoAlpha: 0 }); // 초기 상태: 보이지 않게 설정
    // 깜빡이는 효과
    gsap.to(sequenceBox1.current, {
      autoAlpha: 1,
      duration: 0.7,
      delay: 0.5,
      ease: "power1.inOut",
      yoyo: true,
      repeat: 2,
    });

    gsap.to(sequenceBox2.current, {
      autoAlpha: 1,
      duration: 0.7,
      delay: 0.5,
      ease: "power1.inOut",
      yoyo: true,
      repeat: 2,
    });
  }, []);

  return (
    <div className="image-container hidden xs:block w-[391px] relative h-80">
      <img
        translate="no"
        className="pointer-events-none"
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Sequence-board-game.jpg/732px-Sequence-board-game.jpg"
        alt="Sequence Board Game"
      />

      {/* SVG 오버레이 */}
      {[
        { top: "32px", left: "47px", color: "blue" },
        { top: "116px", left: "124px", color: "orange" },
        { top: "32px", left: "87px", color: "blue" },
        { top: "60px", left: "7px", color: "orange" },
        { top: "32px", left: "127px", color: "blue" },
        { top: "115px", left: "7px", color: "orange" },
        { top: "140px", left: "164px", color: "blue" },
        { top: "60px", left: "164px", color: "orange" },
        { top: "250px", left: "310px", color: "blue" },
        { top: "32px", left: "310px", color: "orange" },
        // { top: "32px", left: "164px", color: "orange" },
        { top: "32px", left: "164px", color: "blue" },
        { top: "224px", left: "270px", color: "blue" },
        { top: "279px", left: "310px", color: "orange" },
        { top: "85px", left: "346px", color: "blue" },
        { top: "250px", left: "310px", color: "orange" },
        { top: "197px", left: "310px", color: "blue" },
        { top: "85px", left: "310px", color: "orange" },
        { top: "60px", left: "309px", color: "blue" },
        { top: "85px", left: "346px", color: "orange" },
        { top: "224px", left: "233px", color: "blue" },
        { top: "85px", left: "270px", color: "orange" },
        { top: "85px", left: "197px", color: "blue" },
        { top: "32px", left: "270px", color: "orange" },
        { top: "224px", left: "197px", color: "blue" },
        { top: "224px", left: "158px", color: "orange" },
        { top: "140px", left: "197px", color: "blue" },
        { top: "197px", left: "197px", color: "orange" },
        { top: "224px", left: "346px", color: "blue" },
        { top: "224px", left: "310px", color: "orange" },
        { top: "224px", left: "47px", color: "blue" },
        { top: "60px", left: "270px", color: "orange" },
        { top: "250px", left: "47px", color: "blue" },
        { top: "115px", left: "270px", color: "orange" },
        { top: "140px", left: "233px", color: "blue" },
        { top: "140px", left: "270px", color: "orange" },
        // { top: "32px", left: "233px", color: "orange" },
        // { top: "140px", left: "233px", color: "blue" },
        // { top: "32px", left: "197px", color: "orange" },
        // { top: "115px", left: "197px", color: "blue" },
      ].map((item, index) => (
        <svg
          key={index}
          className="overlay-element absolute"
          width="36"
          height="36"
          style={{ top: item.top, left: item.left }}
        >
          <circle cx="18" cy="18" r="9" fill={item.color} />
        </svg>
      ))}
      <svg
        ref={sequenceBox1}
        className="overlay-element absolute"
        width="200"
        height="40"
        style={{ top: "24px", left: "0px" }}
      >
        <rect
          x="0"
          y="0"
          width="200"
          height="40"
          fill="none" // 채우기 없음
          stroke="red" // 테두리 색상
          strokeWidth="6" // 테두리 두께
        />
      </svg>
      <svg
        ref={sequenceBox2}
        className="overlay-element absolute"
        width="40"
        height="145"
        style={{ top: "30px", left: "270px" }}
      >
        <rect
          x="0"
          y="0"
          width="40"
          height="145"
          fill="none" // 채우기 없음
          stroke="red" // 테두리 색상
          strokeWidth="6" // 테두리 두께
        />
      </svg>
    </div>
  );
}
