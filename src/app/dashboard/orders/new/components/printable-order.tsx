
"use client";

import React from 'react';
import Image from 'next/image';

export interface OrderPrintData {
    orderDate: string;
    ordererName: string;
    ordererContact: string;
    items: string;
    totalAmount: number;
    deliveryFee: number;
    paymentMethod: string;
    paymentStatus: string;
    deliveryDate: string;
    recipientName: string;
    recipientContact: string;
    deliveryAddress: string;
    message: string;
    branchInfo: {
        name: string;
        address: string;
        contact: string;
        account: string;
    };
}

interface PrintableOrderProps {
    data: OrderPrintData;
}

const branchesContactInfo = [
    { name: "릴리맥여의도점", address: "서울시 영등포구 여의나루로50 The-K타워 B1", tel: "010-8241-9518 / Mob) 010-2285-9518", blog: "http://blog.naver.com/lilymag1", email: "lilymag3@naver.com", kakao: "릴리맥" },
    { name: "릴리맥여의도2호점", address: "서울시 영등포구 국제금융로8길 31 SK증권빌딩 B1", tel: "010-7939-9518 / Mob) 010-2285-9518", blog: "http://blog.naver.com/lilymag1", email: "lilymag4@naver.com", kakao: "릴리맥여의도2호점" },
    { name: "릴리맥NC이스트폴점", address: "서울시 광진구 아차산로 402, G1층", tel: "010-2908-5459 / Mob) 010-2285-9518", blog: "http://blog.naver.com/lilymag1", email: "lilymag5@naver.com", kakao: "릴리맥NC이스트폴" },
    { name: "릴리맥광화문점", address: "서울시 중구 세종대로 136 서울파이낸스빌딩 B2", tel: "010-2385-9518 / Mob) 010-2285-9518", blog: "http://blog.naver.com/lilymag1", email: "lilymag6@naver.com", kakao: "릴리맥광화문점" },
    { name: "[온라인쇼핑몰]", address: "www.lilymagshop.co.kr", tel: "", blog: "", email: "", kakao: "" }
];

export const PrintableOrder = React.forwardRef<HTMLDivElement, PrintableOrderProps>(({ data }, ref) => {
    
    const renderSection = (title: string, isReceipt: boolean) => (
        <div className="mb-4">
            <div className="text-center mb-4">
                { !isReceipt && (
                    <>
                    <Image src="https://ecimg.cafe24img.com/pg1472b45444056090/lilymagflower/web/upload/category/logo/v2_d13ecd48bab61a0269fab4ecbe56ce07_lZMUZ1lORo_top.jpg" alt="Logo" width={180} height={45} className="mx-auto" priority unoptimized />
                    <h1 className="text-2xl font-bold mt-2">릴리맥 플라워앤가든 {title}</h1>
                    </>
                )}
                { isReceipt && <h1 className="text-2xl font-bold mt-2">{title}</h1> }
            </div>
            <table className="w-full border-collapse border border-black text-sm">
                <tbody>
                    <tr>
                        <td className="border border-black p-1 font-bold w-1/6">주문일</td>
                        <td className="border border-black p-1 w-2/6">{data.orderDate}</td>
                        <td className="border border-black p-1 font-bold w-1/6">주문자성명</td>
                        <td className="border border-black p-1 w-1/6">{data.ordererName}</td>
                        <td className="border border-black p-1 font-bold w-1/6">연락처</td>
                        <td className="border border-black p-1 w-1/6">{data.ordererContact}</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1 font-bold align-top h-24">항목/수량</td>
                        <td className="border border-black p-1 align-top whitespace-pre-wrap">{data.items}</td>
                        <td colSpan={4}>
                             <table className="w-full h-full border-collapse">
                                <tbody>
                                    <tr>
                                        <td className="border border-black p-1 font-bold w-1/3">금액</td>
                                        <td className="border border-black p-1 w-2/3">₩{data.totalAmount.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-1 font-bold">배송비</td>
                                        <td className="border border-black p-1">₩{data.deliveryFee.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    { !isReceipt && (
                         <tr>
                            <td className="border-t-0"></td>
                            <td className="border-t-0"></td>
                            <td colSpan={4}>
                                <table className="w-full h-full border-collapse">
                                    <tbody>
                                        <tr>
                                            <td className="border border-black p-1 font-bold w-1/3">결제수단</td>
                                            <td className="border border-black p-1 w-1/3">{data.paymentMethod}</td>
                                            <td className="border border-black p-1 w-1/3">{data.paymentStatus}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    )}
                    <tr>
                        <td className="border border-black p-1 font-bold">배송일/시간</td>
                        <td className="border border-black p-1">{data.deliveryDate}</td>
                        <td className="border border-black p-1 font-bold">받으시는분 성함</td>
                        <td className="border border-black p-1">{data.recipientName}</td>
                        <td className="border border-black p-1 font-bold">연락처</td>
                        <td className="border border-black p-1">{data.recipientContact}</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1 font-bold">배송지주소</td>
                        <td colSpan={5} className="border border-black p-1">{data.deliveryAddress}</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1 font-bold align-top h-16">전달메세지<br/>(카드/리본)</td>
                        <td colSpan={5} className="border border-black p-1 align-top">{data.message}</td>
                    </tr>
                    {isReceipt && (
                        <tr>
                            <td className="border border-black p-1 font-bold">인수자성명</td>
                            <td colSpan={5} className="border border-black p-1 h-10"></td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div ref={ref} className="p-4 bg-white text-black font-sans">
            {renderSection('주문서', false)}
            
            <div className="border-t-2 border-dashed border-gray-400 my-8"></div>

            {renderSection('인수증', true)}

             <div className="mt-8">
                <table className="w-full border-collapse border border-black text-xs">
                    <tbody>
                        {branchesContactInfo.map(branch => (
                            <tr key={branch.name}>
                                <td className="border border-black p-1 font-bold w-1/5">{branch.name}</td>
                                <td className="border border-black p-1 w-4/5">
                                    {branch.address}
                                    {branch.tel && <><br/>Tel) {branch.tel}</>}
                                    {branch.blog && <><br/>{branch.blog}</>}
                                    {branch.email && <> E-mail: {branch.email}</>}
                                    {branch.kakao && <> Kakao: {branch.kakao}</>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
});

PrintableOrder.displayName = 'PrintableOrder';
