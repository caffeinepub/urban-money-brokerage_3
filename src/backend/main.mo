import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Order "mo:core/Order";

actor {
  var nextSerialNumber = 1;
  let records = Map.empty<Nat, RecordData>();

  type RecordData = {
    serialNumber : Nat;
    finance : Text;
    customerName : Text;
    mcf : Text;
    product : Text;
    grossAmount : Float;
    netAmount : Float;
    loanAmount : ?Float;
    brokerageAmountReceivedDate : ?Text;
    bankAmountReceivedDate : ?Text;
    remark : Remark;
  };

  type Remark = {
    #received;
    #pending;
  };

  module RecordData {
    public func compare(r1 : RecordData, r2 : RecordData) : Order.Order {
      Nat.compare(r1.serialNumber, r2.serialNumber);
    };
  };

  public shared ({ caller }) func createRecord(finance : Text, customerName : Text, mcf : Text, product : Text, grossAmount : Float, netAmount : Float, loanAmount : ?Float, brokerageAmountReceivedDate : ?Text, bankAmountReceivedDate : ?Text, remark : Remark) : async Nat {
    let record : RecordData = {
      serialNumber = nextSerialNumber;
      finance;
      customerName;
      mcf;
      product;
      grossAmount;
      netAmount;
      loanAmount;
      brokerageAmountReceivedDate;
      bankAmountReceivedDate;
      remark;
    };
    records.add(nextSerialNumber, record);
    nextSerialNumber += 1;
    nextSerialNumber - 1;
  };

  public query ({ caller }) func getRecord(serialNumber : Nat) : async RecordData {
    switch (records.get(serialNumber)) {
      case (null) { Runtime.trap("Record not found") };
      case (?record) { record };
    };
  };

  public query ({ caller }) func getAllRecords() : async [RecordData] {
    records.values().toArray().sort();
  };

  public shared ({ caller }) func updateRecord(serialNumber : Nat, finance : Text, customerName : Text, mcf : Text, product : Text, grossAmount : Float, netAmount : Float, loanAmount : ?Float, brokerageAmountReceivedDate : ?Text, bankAmountReceivedDate : ?Text, remark : Remark) : async () {
    switch (records.get(serialNumber)) {
      case (null) { Runtime.trap("Record not found") };
      case (_) {
        let updatedRecord : RecordData = {
          serialNumber;
          finance;
          customerName;
          mcf;
          product;
          grossAmount;
          netAmount;
          loanAmount;
          brokerageAmountReceivedDate;
          bankAmountReceivedDate;
          remark;
        };
        records.add(serialNumber, updatedRecord);
      };
    };
  };

  public shared ({ caller }) func deleteRecord(serialNumber : Nat) : async () {
    switch (records.get(serialNumber)) {
      case (null) { Runtime.trap("Record not found") };
      case (_) { records.remove(serialNumber) };
    };
  };
};
