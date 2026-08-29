output "instance_public_ip" {
  description = "Public IP address of TalkByte backend"
  value       = oci_core_instance.talkbyte_backend.public_ip
}

output "instance_id" {
  description = "Oracle Cloud instance ID"
  value       = oci_core_instance.talkbyte_backend.id
}

output "vcn_id" {
  description = "VCN ID"
  value       = oci_core_vcn.talkbyte_vcn.id
}
